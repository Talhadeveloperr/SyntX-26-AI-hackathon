# backend/app/pastpaper_ai/config.py
import os

_BACKEND_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)


class PastpaperAIConfig:
    OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.environ.get("PASTPAPER_OLLAMA_MODEL", "qwen2.5:1.5b")
    TEMPERATURE = 0.3
    REQUEST_TIMEOUT = 180  # Analysis might take a bit longer
    LLM_MAX_RETRIES = 3

    PAST_PAPERS_DIR = os.path.join(_BACKEND_ROOT, "Past_papers")
    ALLOWED_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".bmp", ".gif", ".webp"}
    ALLOWED_DOC_EXT = {".pdf", ".docx", ".doc", ".txt", ".md"}

    @classmethod
    def ensure_pastpapers_dir(cls):
        os.makedirs(cls.PAST_PAPERS_DIR, exist_ok=True)
