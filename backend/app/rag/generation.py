from ollama import Client


MODEL = "llama3.1:8b"


def generate_answer(question: str, context: list[str]) -> str:
    client = Client(host="http://ollama:11434")

    context_text = "\n\n".join(context)

    prompt = f"""
You are a question-answering assistant for a document retrieval system.

Answer the user's question using ONLY the information contained in the
provided context.

Rules:
1. If the context directly contains the answer, answer the question directly.
2. The answer may be based on a short sentence, phrase, or factual statement.
3. Do not require the context to contain a detailed explanation.
4. Do not use your own knowledge or information outside the context.
5. If the answer cannot be determined from the context, respond exactly with:
"I don't have enough information in the provided documents."

Context:
{context_text}

Question:
{question}

Answer:
"""

    response = client.chat(
        model=MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    return response["message"]["content"].strip()