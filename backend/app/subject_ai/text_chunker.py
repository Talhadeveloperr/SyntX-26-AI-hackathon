from app.subject_ai.config import SubjectAIConfig


def chunk_subject_text(text: str, chunk_size: int = None, overlap: int = None) -> list[str]:
    if not text or not text.strip():
        return []

    chunk_size = chunk_size or SubjectAIConfig.CHUNK_SIZE
    overlap = overlap or SubjectAIConfig.CHUNK_OVERLAP
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
