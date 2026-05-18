from app.subject_ai.document_extractor import SubjectDocumentExtractor
from app.subject_ai.text_chunker import chunk_subject_text
from app.subject_ai.vector_store import SubjectVectorStore


class SubjectOrchestrator:
    """Extract text from subject documents and index into per-subject FAISS store."""

    def ingest_document(
        self,
        student_id: int,
        folder_name: str,
        document_id: int,
        file_path: str,
        file_name: str,
        mime_type: str = None,
    ) -> tuple[list[str], list[int]]:
        raw = SubjectDocumentExtractor.extract(file_path, mime_type)
        chunks = chunk_subject_text(raw)
        store = SubjectVectorStore(student_id, folder_name)
        faiss_ids = store.add_chunks(chunks, document_id, file_name)
        return chunks, faiss_ids
