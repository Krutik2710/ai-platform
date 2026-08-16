from fastapi import FastAPI

app = FastAPI(title="AI Platform API")


@app.get("/health")
def health():
    return {"status": "healthy"}