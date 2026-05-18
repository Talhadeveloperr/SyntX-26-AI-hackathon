import os

_BACKEND_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)


class AIConfig:
    CHAT_DOCUMENTS_ROOT = os.path.join(_BACKEND_ROOT, "Chat_documents")
    FILES_DIR = os.path.join(CHAT_DOCUMENTS_ROOT, "files")
    IMAGES_DIR = os.path.join(CHAT_DOCUMENTS_ROOT, "images")
    FAISS_DIR = os.path.join(CHAT_DOCUMENTS_ROOT, "faiss_indexes")

    EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
    OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:1.5b")

    CHUNK_SIZE = 500
    CHUNK_OVERLAP = 80
    TOP_K_CHUNKS = 5
    MAX_HISTORY_MESSAGES = 12

    ALLOWED_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"}
    ALLOWED_DOC_EXT = {".pdf", ".docx", ".doc", ".txt", ".md", ".csv"}
    ALLOWED_FILE_EXT = ALLOWED_IMAGE_EXT | ALLOWED_DOC_EXT | {".json", ".xml", ".html"}

    @classmethod
    def ensure_dirs(cls):
        for path in (
            cls.CHAT_DOCUMENTS_ROOT,
            cls.FILES_DIR,
            cls.IMAGES_DIR,
            cls.FAISS_DIR,
        ):
            os.makedirs(path, exist_ok=True)
