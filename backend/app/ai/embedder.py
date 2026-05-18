import threading

import numpy as np

from app.ai.config import AIConfig

_model = None
_lock = threading.Lock()


class Embedder:
    """Lazy-loaded sentence-transformers embedder."""

    @staticmethod
    def _get_model():
        global _model
        if _model is None:
            with _lock:
                if _model is None:
                    from sentence_transformers import SentenceTransformer

                    _model = SentenceTransformer(AIConfig.EMBEDDING_MODEL)
        return _model

    @classmethod
    def embed_texts(cls, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.array([], dtype=np.float32)
        model = cls._get_model()
        vectors = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        return vectors.astype(np.float32)

    @classmethod
    def embed_query(cls, query: str) -> np.ndarray:
        model = cls._get_model()
        vector = model.encode([query], convert_to_numpy=True, show_progress_bar=False)
        return vector[0].astype(np.float32)

    @classmethod
    def dimension(cls) -> int:
        return cls._get_model().get_sentence_embedding_dimension()
