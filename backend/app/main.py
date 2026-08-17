import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from backend.app.rag.db import init_db
from backend.app.rag.ingestion import ingest_document


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