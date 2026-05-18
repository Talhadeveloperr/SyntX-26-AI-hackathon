import os

from app.agents.document_agent import DocumentAgent
from app.agents.image_agent import ImageAgent
from app.ai.config import AIConfig
from app.ai.text_chunker import chunk_text
from app.ai.vector_store import VectorStore


class AgentOrchestrator:
    """Routes files to document/image agents, chunks, and indexes into FAISS."""

    def __init__(self):
        self._agents = [ImageAgent(), DocumentAgent()]

    def classify_file_type(self, filename: str, mime_type: str = None) -> str:
        ext = os.path.splitext(filename)[1].lower()
        if ext in AIConfig.ALLOWED_IMAGE_EXT or (
            mime_type and mime_type.startswith("image/")
        ):
            return "image"
        if ext in AIConfig.ALLOWED_DOC_EXT:
            return "document"
        return "file"

    def extract_text(self, file_path: str, mime_type: str = None) -> str:
        for agent in self._agents:
            if agent.can_handle(file_path, mime_type):
                return agent.extract_text(file_path)

        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except OSError:
            return f"[Binary file uploaded: {os.path.basename(file_path)}]"

    def ingest_file(
        self,
        session_id: int,
        document_id: int,
        file_path: str,
        file_name: str,
        mime_type: str = None,
    ) -> tuple[list[str], list[int]]:
        raw = self.extract_text(file_path, mime_type)
        chunks = chunk_text(raw)
        store = VectorStore(session_id)
        faiss_ids = store.add_chunks(chunks, document_id, file_name)
        return chunks, faiss_ids
