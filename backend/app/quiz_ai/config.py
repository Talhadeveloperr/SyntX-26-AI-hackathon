import os

_BACKEND_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)


class QuizAIConfig:
    OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.environ.get("QUIZ_OLLAMA_MODEL", "qwen2.5:1.5b")
    TEMPERATURE = 0.4
    REQUEST_TIMEOUT = 120
    LLM_MAX_RETRIES = 3

    CALLS_PER_QUESTION = 4
    MAX_PARALLEL_WORKERS = 16
    CONTEXT_CHUNKS_PER_CALL = 3

    QUIZ_JSON_DIR = os.path.join(_BACKEND_ROOT, "Quiz_generations")

    @classmethod
    def ensure_json_dir(cls):
        os.makedirs(cls.QUIZ_JSON_DIR, exist_ok=True)
