# backend/app/flashcard_agents/orchestrator.py
import json
import os
import threading
from datetime import datetime

from app.flashcard_agents.card_agent import FlashcardAgent
from app.flashcard_ai.config import FlashcardAIConfig


class FlashcardProgressWriter:
    """
    Writes flashcard generation progress to a JSON file after each card,
    mirroring the QuizProgressWriter pattern.
    """

    def __init__(self, filepath: str, meta: dict):
        self.filepath = filepath
        self._lock = threading.Lock()
        self._data = {
            "status": "in_progress",
            "started_at": datetime.utcnow().isoformat() + "Z",
            "cards": [],
            **meta,
        }
        self._flush()

    def add_card(self, card_payload: dict):
        with self._lock:
            self._data["cards"].append(card_payload)
            self._data["completed"] = len(self._data["cards"])
            self._flush()

    def finish(self, flashcard_set_id: int = None):
        with self._lock:
            self._data["status"] = "completed"
            self._data["finished_at"] = datetime.utcnow().isoformat() + "Z"
            if flashcard_set_id is not None:
                self._data["flashcard_set_id"] = flashcard_set_id
            self._flush()

    def fail(self, error: str):
        with self._lock:
            self._data["status"] = "failed"
            self._data["error"] = error
            self._flush()

    def _flush(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        with open(self.filepath, "w", encoding="utf-8") as f:
            json.dump(self._data, f, ensure_ascii=False, indent=2)


class FlashcardOrchestrator:
    """
    Generates flashcards sequentially (one LLM call per card).
    Each card uses a different embedding context drawn from the subject FAISS index.
    After each card is ready it is appended to the progress JSON file.
    """

    def __init__(self):
        self._card_agent = FlashcardAgent()

    def generate_all(
        self,
        context_fetcher,
        subject_name: str,
        num_cards: int,
        progress_writer: FlashcardProgressWriter,
    ) -> list[dict]:
        results = []
        for card_index in range(num_cards):
            card_number = card_index + 1
            item = self._generate_one_card(
                context_fetcher=context_fetcher,
                subject_name=subject_name,
                card_number=card_number,
                total_cards=num_cards,
            )
            progress_writer.add_card(item)
            results.append(item)
        return results

    def _generate_one_card(
        self,
        context_fetcher,
        subject_name: str,
        card_number: int,
        total_cards: int,
    ) -> dict:
        context = context_fetcher(card_number)

        last_exc = None
        for _ in range(FlashcardAIConfig.LLM_MAX_RETRIES):
            try:
                result = self._card_agent.run(
                    context=context,
                    subject_name=subject_name,
                    card_number=card_number,
                    total_cards=total_cards,
                )
                return {
                    "card_index": card_number,
                    "question": result["question"],
                    "answer": result["answer"],
                }
            except Exception as exc:
                last_exc = exc

        raise last_exc
