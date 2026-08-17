from pathlib import Path

from pypdf import PdfReader


def extract_text(filename: str, content: bytes) -> str:
    suffix = Path(filename).suffix.lower()

    if suffix == ".txt":
        return content.decode("utf-8")

    if suffix == ".pdf":
        import io

        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    raise ValueError("Unsupported file type. Use PDF or TXT.")
