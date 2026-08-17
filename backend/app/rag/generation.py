from ollama import Client


MODEL = "llama3.1:8b"


def generate_answer(question: str, context: list[str]) -> str:
    client = Client(host="http://ollama:11434")

    context_text = "\n\n".join(context)

    prompt = f"""
Answer the question using only the provided context.

If the answer cannot be found in the context, say:
"I don't have enough information in the provided documents."

Context:
{context_text}

Question:
{question}
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

    return response["message"]["content"]
    