from .db import get_connection
from .embeddings import create_embedding
from .chunking import chunk_text


def ingest_document(filename: str, text: str) -> int:
    chunks = chunk_text(text)

    if not chunks:
        raise ValueError("Document is empty")

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO documents (filename)
                VALUES (%s)
                RETURNING id
                """,
                (filename,),
            )

            document_id = cur.fetchone()[0]

            for chunk in chunks:
                embedding = create_embedding(chunk)

                cur.execute(
                    """
                    INSERT INTO document_chunks
                        (document_id, chunk_text, embedding)
                    VALUES (%s, %s, %s)
                    """,
                    (document_id, chunk, embedding),
                )

        conn.commit()

    return document_id