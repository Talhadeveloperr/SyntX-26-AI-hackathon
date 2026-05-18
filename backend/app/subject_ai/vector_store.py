import json
import os
import threading

import faiss
import numpy as np

from app.subject_ai.config import SubjectAIConfig
from app.subject_ai.embedder import SubjectEmbedder

_store_lock = threading.Lock()


class SubjectVectorStore:
    """FAISS index stored inside each subject's embeddings folder."""

    def __init__(self, student_id: int, folder_name: str):
        emb_dir = SubjectAIConfig.embeddings_dir(student_id, folder_name)
        os.makedirs(emb_dir, exist_ok=True)
        self.index_path = os.path.join(emb_dir, "subject.index")
        self.meta_path = os.path.join(emb_dir, "subject_meta.json")
        self._index = None
        self._meta: list[dict] = []

    def _load(self):
        if self._index is not None:
            return
        dim = SubjectEmbedder.dimension()
        if os.path.exists(self.index_path):
            self._index = faiss.read_index(self.index_path)
            if os.path.exists(self.meta_path):
                with open(self.meta_path, "r", encoding="utf-8") as f:
                    self._meta = json.load(f)
        else:
            self._index = faiss.IndexFlatIP(dim)
            self._meta = []

    def _save(self):
        faiss.write_index(self._index, self.index_path)
        with open(self.meta_path, "w", encoding="utf-8") as f:
            json.dump(self._meta, f, ensure_ascii=False, indent=2)

    def add_chunks(self, chunks: list[str], document_id: int, file_name: str) -> list[int]:
        if not chunks:
            return []

        with _store_lock:
            self._load()
            vectors = SubjectEmbedder.embed_texts(chunks)
            if vectors.size == 0:
                return []

            norms = np.linalg.norm(vectors, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            vectors = vectors / norms

            start_id = self._index.ntotal
            self._index.add(vectors)

            faiss_ids = []
            for i, chunk in enumerate(chunks):
                faiss_id = start_id + i
                self._meta.append({
                    "faiss_id": faiss_id,
                    "document_id": document_id,
                    "file_name": file_name,
                    "text": chunk,
                })
                faiss_ids.append(faiss_id)

            self._save()
            return faiss_ids

    def search(self, query: str, top_k: int = None) -> list[dict]:
        top_k = top_k or SubjectAIConfig.TOP_K_CHUNKS
        with _store_lock:
            self._load()
            if self._index.ntotal == 0:
                return []

            q = SubjectEmbedder.embed_query(query)
            norm = np.linalg.norm(q)
            if norm > 0:
                q = q / norm
            q = q.reshape(1, -1)

            k = min(top_k, self._index.ntotal)
            scores, indices = self._index.search(q, k)

            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < 0 or idx >= len(self._meta):
                    continue
                item = dict(self._meta[idx])
                item["score"] = float(score)
                results.append(item)
            return results
