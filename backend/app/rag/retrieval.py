from backend.app.rag.db import get_connection
from backend.app.rag.embeddings import create_embedding


def search_similar_chunks(query: str, limit: int = 5) -> list[dict]:
    query_embedding = create_embedding(query)

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    id,
                    document_id,
                    chunk_text,
                    1 - (embedding <=> %s::vector) AS similarity
                FROM document_chunks
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (query_embedding, query_embedding, limit),
            )

            rows = cur.fetchall()

    return [
        {
            "chunk_id": row[0],
            "document_id": row[1],
            "text": row[2],
            "similarity": float(row[3]),
        }
        for row in rows
    ]
