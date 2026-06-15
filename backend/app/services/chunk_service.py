from typing import List


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks for better RAG retrieval."""
    if not text or not text.strip():
        return []

    # Clean up whitespace
    text = " ".join(text.split())

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size

        # Try to break at a sentence boundary
        if end < len(text):
            for sep in [". ", ".\n", "! ", "? ", "\n\n", "\n"]:
                idx = text.rfind(sep, start, end)
                if idx != -1 and idx + len(sep) > start + overlap:
                    end = idx + len(sep)
                    break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - overlap  # overlap for context continuity
        if start >= len(text):
            break

    return chunks