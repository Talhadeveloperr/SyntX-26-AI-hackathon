from app.ai.config import AIConfig


def chunk_text(text: str, chunk_size: int = None, overlap: int = None) -> list[str]:
    if not text or not text.strip():
        return []

    chunk_size = chunk_size or AIConfig.CHUNK_SIZE
    overlap = overlap or AIConfig.CHUNK_OVERLAP
    text = " ".join(text.split())
    chunks = []
    start = 0
    length = len(text)

    while start < length:
        end = min(start + chunk_size, length)
        piece = text[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= length:
            break
        start = max(end - overlap, start + 1)

    return chunks
