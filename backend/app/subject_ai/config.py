import os

_BACKEND_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)


class SubjectAIConfig:
    SUBJECTS_ROOT = os.path.join(_BACKEND_ROOT, "Subjects_Docs")

    EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
    CHUNK_SIZE = 500
    CHUNK_OVERLAP = 80
    TOP_K_CHUNKS = 5

    ALLOWED_DOC_EXT = {".pdf", ".docx", ".doc", ".txt", ".md", ".csv"}
    ALLOWED_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"}
    ALLOWED_FILE_EXT = ALLOWED_DOC_EXT | ALLOWED_IMAGE_EXT | {".json", ".xml", ".html"}

    @classmethod
    def user_root(cls, student_id: int) -> str:
        return os.path.join(cls.SUBJECTS_ROOT, str(student_id))

    @classmethod
    def subject_folder(cls, student_id: int, folder_name: str) -> str:
        return os.path.join(cls.user_root(student_id), folder_name)

    @classmethod
    def documents_dir(cls, student_id: int, folder_name: str) -> str:
        return os.path.join(cls.subject_folder(student_id, folder_name), "Documents")

    @classmethod
    def embeddings_dir(cls, student_id: int, folder_name: str) -> str:
        return os.path.join(cls.subject_folder(student_id, folder_name), "embeddings")

    @classmethod
    def ensure_subject_dirs(cls, student_id: int, folder_name: str) -> tuple[str, str]:
        os.makedirs(cls.SUBJECTS_ROOT, exist_ok=True)
        os.makedirs(cls.user_root(student_id), exist_ok=True)
        docs = cls.documents_dir(student_id, folder_name)
        emb = cls.embeddings_dir(student_id, folder_name)
        os.makedirs(docs, exist_ok=True)
        os.makedirs(emb, exist_ok=True)
        return docs, emb
