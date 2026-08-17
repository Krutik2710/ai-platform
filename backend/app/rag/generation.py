import os

from openai import OpenAI


MODEL = "gpt-4.1-mini"


def generate_answer(question: str, context: list[str]) -> str:
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

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

    response = client.responses.create(
        model=MODEL,
        input=prompt,
    )

    return response.output_text
