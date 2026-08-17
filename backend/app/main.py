from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.rag.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="AI Platform API",
    lifespan=lifespan,
)


@app.get("/health")
def health():
    return {"status": "healthy"}