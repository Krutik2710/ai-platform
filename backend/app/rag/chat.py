from .db import get_connection


def create_session() -> int:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO chat_sessions DEFAULT VALUES
                RETURNING id
                """
            )
            session_id = cur.fetchone()[0]

        conn.commit()

    return session_id


def add_message(session_id: int, role: str, content: str) -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO chat_messages (session_id, role, content)
                VALUES (%s, %s, %s)
                """,
                (session_id, role, content),
            )

        conn.commit()


def get_messages(session_id: int) -> list[dict]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT role, content, created_at
                FROM chat_messages
                WHERE session_id = %s
                ORDER BY created_at ASC
                """,
                (session_id,),
            )

            rows = cur.fetchall()

    return [
        {
            "role": row[0],
            "content": row[1],
            "created_at": row[2],
        }
        for row in rows
    ]


def get_chat_sessions() -> list[dict]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    s.id,
                    s.created_at,
                    COALESCE(
                        (
                            SELECT m.content
                            FROM chat_messages m
                            WHERE m.session_id = s.id
                              AND m.role = 'user'
                            ORDER BY m.created_at ASC
                            LIMIT 1
                        ),
                        'New conversation'
                    ) AS title,
                    (
                        SELECT MAX(m.created_at)
                        FROM chat_messages m
                        WHERE m.session_id = s.id
                    ) AS last_message_at
                FROM chat_sessions s
                ORDER BY COALESCE(
                    (
                        SELECT MAX(m.created_at)
                        FROM chat_messages m
                        WHERE m.session_id = s.id
                    ),
                    s.created_at
                ) DESC
                """
            )

            rows = cur.fetchall()

    return [
        {
            "id": row[0],
            "created_at": row[1],
            "title": row[2],
            "last_message_at": row[3],
        }
        for row in rows
    ]