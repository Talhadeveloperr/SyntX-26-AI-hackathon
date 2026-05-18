# backend/app/flashcard_ai/config.py
import os

_BACKEND_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)


class FlashcardAIConfig:
    OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL    = os.environ.get("FLASHCARD_OLLAMA_MODEL", "qwen2.5:1.5b")
    TEMPERATURE     = 0.3
    REQUEST_TIMEOUT = 120
    LLM_MAX_RETRIES = 3

    # How many embedding chunks to pull per flashcard
    CONTEXT_CHUNKS_PER_CARD = 3

    # Default number of flashcards when not specified by caller
    DEFAULT_NUM_CARDS = 10

    # Max cards allowed in one request
    MAX_NUM_CARDS = 50

    # Output folder for progress JSON files (mirrors Quiz_generations/)
    FLASHCARD_JSON_DIR = os.path.join(_BACKEND_ROOT, "Flashcard_generations")

    @classmethod
    def ensure_json_dir(cls):
        os.makedirs(cls.FLASHCARD_JSON_DIR, exist_ok=True)
