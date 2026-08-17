import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel

from .rag.db import init_db
from .rag.ingestion import ingest_document
from .rag.retrieval import search_similar_chunks

from .rag.generation import generate_answer

from .rag.chat import create_session, add_message, get_messages

from .rag.document_loader import extract_text




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
    session_id: int | None = None


@app.post("/query")
def query_documents(request: QueryRequest):
    session_id = request.session_id

    if session_id is None:
        session_id = create_session()

    add_message(session_id, "user", request.question)

    results = search_similar_chunks(
        request.question,
        request.limit,
    )

    context = [result["text"] for result in results]

    answer = generate_answer(
        request.question,
        context,
    )

    add_message(session_id, "assistant", answer)

    return {
        "session_id": session_id,
        "question": request.question,
        "answer": answer,
        "results": results,
    }

@app.get("/chat/{session_id}")
def chat_history(session_id: int):
    return {
        "session_id": session_id,
        "messages": get_messages(session_id),
    }

@app.post("/documents/upload")
async def upload_document_file(file: UploadFile = File(...)):
    try:
        content = await file.read()

        text = extract_text(
            file.filename or "document",
            content,
        )

        document_id = ingest_document(
            file.filename or "document",
            text,
        )

        return {
            "document_id": document_id,
            "filename": file.filename,
            "status": "ingested",
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )