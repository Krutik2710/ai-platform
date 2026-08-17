import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .rag.db import init_db
from .rag.ingestion import ingest_document
from .rag.retrieval import search_similar_chunks

from .rag.generation import generate_answer


@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("INIT_DB", "true").lower() == "true":
        init_db()
    yield


app = FastAPI(
    title="AI Platform API",
    lifespan=lifespan,
)


class DocumentRequest(BaseModel):
    filename: str
    text: str


@app.get("/health")
def health():
    return {"status": "healthy"}


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

class QueryRequest(BaseModel):
    question: str
    limit: int = 5

@app.post("/query")
def query_documents(request: QueryRequest):
    results = search_similar_chunks(
        request.question,
        request.limit,
    )

    context = [result["text"] for result in results]

    answer = generate_answer(
        request.question,
        context,
    )

    return {
        "question": request.question,
        "answer": answer,
        "results": results,
    }