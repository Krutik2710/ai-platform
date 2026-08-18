import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel
from prometheus_client import (
    Counter,
    Histogram,
    generate_latest,
    CONTENT_TYPE_LATEST,
)

from .rag.db import init_db
from .rag.ingestion import ingest_document
from .rag.retrieval import search_similar_chunks
from .rag.generation import generate_answer
from .rag.chat import create_session, add_message, get_messages
from .rag.document_loader import extract_text

import uuid

from .storage.s3 import upload_document, delete_document


# -------------------------------------------------------------------
# Prometheus metrics
# -------------------------------------------------------------------

REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status"],
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
)

REQUEST_ERRORS = Counter(
    "http_requests_errors_total",
    "Total number of failed HTTP requests",
    ["method", "endpoint"],
)


# -------------------------------------------------------------------
# Application lifecycle
# -------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("INIT_DB", "true").lower() == "true":
        init_db()
    yield


app = FastAPI(
    title="AI Platform API",
    lifespan=lifespan,
)


# -------------------------------------------------------------------
# Metrics middleware
# -------------------------------------------------------------------

@app.middleware("http")
async def metrics_middleware(request, call_next):
    start_time = time.perf_counter()
    response = None

    try:
        response = await call_next(request)
        return response

    except Exception:
        REQUEST_ERRORS.labels(
            request.method,
            request.url.path,
        ).inc()

        raise

    finally:
        duration = time.perf_counter() - start_time
        endpoint = request.url.path

        REQUEST_LATENCY.labels(
            request.method,
            endpoint,
        ).observe(duration)

        status = str(response.status_code) if response else "500"

        REQUEST_COUNT.labels(
            request.method,
            endpoint,
            status,
        ).inc()


# -------------------------------------------------------------------
# Models
# -------------------------------------------------------------------

class DocumentRequest(BaseModel):
    filename: str
    text: str


class QueryRequest(BaseModel):
    question: str
    limit: int = 5
    session_id: int | None = None


# -------------------------------------------------------------------
# Health
# -------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "healthy"}


# -------------------------------------------------------------------
# Prometheus metrics endpoint
# -------------------------------------------------------------------

@app.get("/metrics")
def metrics():
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )


# -------------------------------------------------------------------
# Document ingestion
# -------------------------------------------------------------------

@app.post("/documents")
def upload_document(document: DocumentRequest):
    try:
        document_id = ingest_document(
            document.filename,
            document.text,
        )

        return {
            "document_id": document_id,
            "status": "ingested",
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )


@app.post("/documents/upload")
async def upload_document_file(file: UploadFile = File(...)):
    s3_key = None

    try:
        content = await file.read()

        filename = file.filename or "document"

        s3_key = f"documents/{uuid.uuid4()}/{filename}"

        content_type = file.content_type or "application/octet-stream"

        upload_document(
            file_bytes=content,
            s3_key=s3_key,
            content_type=content_type,
        )

        text = extract_text(
            filename,
            content,
        )

        document_id = ingest_document(
            filename,
            text,
            s3_key,
        )

        return {
            "document_id": document_id,
            "filename": filename,
            "status": "ingested",
            "s3_key": s3_key,
        }

    except ValueError as exc:
        if s3_key:
            delete_document(s3_key)

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception:
        if s3_key:
            delete_document(s3_key)

        raise


# -------------------------------------------------------------------
# RAG query
# -------------------------------------------------------------------

@app.post("/query")
def query_documents(request: QueryRequest):
    session_id = request.session_id

    if session_id is None:
        session_id = create_session()

    add_message(
        session_id,
        "user",
        request.question,
    )

    results = search_similar_chunks(
        request.question,
        request.limit,
    )

    context = [result["text"] for result in results]

    answer = generate_answer(
        request.question,
        context,
    )

    add_message(
        session_id,
        "assistant",
        answer,
    )

    return {
        "session_id": session_id,
        "question": request.question,
        "answer": answer,
        "results": results,
    }


# -------------------------------------------------------------------
# Chat history
# -------------------------------------------------------------------

@app.get("/chat/{session_id}")
def chat_history(session_id: int):
    return {
        "session_id": session_id,
        "messages": get_messages(session_id),
    }