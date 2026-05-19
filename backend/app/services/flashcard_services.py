# backend/app/services/flashcard_services.py
import json
import os
from datetime import datetime

from app.database.connection import get_sql_connection
from app.flashcard_agents.orchestrator import FlashcardOrchestrator, FlashcardProgressWriter
from app.flashcard_ai.config import FlashcardAIConfig
from app.subject_ai.config import SubjectAIConfig
from app.subject_ai.vector_store import SubjectVectorStore


def _chunk_text(item) -> str:
    """Safely extract text from a chunk dict or plain string."""
    if isinstance(item, dict):
        return (item.get("text") or "").strip()
    if isinstance(item, str):
        return item.strip()
    return ""


class FlashcardService:
    _orchestrator = FlashcardOrchestrator()

    # ------------------------------------------------------------------ #
    #  DB helpers                                                          #
    # ------------------------------------------------------------------ #
    @staticmethod
    def _get_subject(student_id: int, subject_id: int):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT subject_id, student_id, subject_name, folder_name "
            "FROM subjects WHERE subject_id = ? AND student_id = ?",
            (subject_id, student_id),
        )
        row = cursor.fetchone()
        conn.close()
        if not row:
            raise ValueError("Subject not found or does not belong to this student")
        return row

    # ------------------------------------------------------------------ #
    #  Embeddings helpers                                                  #
    # ------------------------------------------------------------------ #
    @staticmethod
    def _embeddings_path(student_id: int, folder_name: str) -> str:
        return SubjectAIConfig.embeddings_dir(student_id, folder_name)

    @classmethod
    def _load_meta_texts(cls, meta_path: str) -> list[str]:
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        if not isinstance(meta, list):
            return []
        texts = []
        for m in meta:
            t = _chunk_text(m)
            if t:
                texts.append(t)
        return texts

    @classmethod
    def _make_context_fetcher(cls, store: SubjectVectorStore, subject_name: str, meta_path: str):
        """
        Returns a function(card_number) -> context string.
        Uses different query templates to vary the embedding context per card,
        ensuring each flashcard covers a different aspect of the material.
        """
        query_templates = [
            "key concepts and definitions {}",
            "important facts and details {}",
            "examples and applications {}",
            "summary and review points {}",
            "terminology and vocabulary {}",
            "processes and procedures {}",
            "comparisons and contrasts {}",
            "causes and effects {}",
            "principles and rules {}",
            "historical context and background {}",
        ]

        def fetcher(card_number: int) -> str:
            tpl = query_templates[(card_number - 1) % len(query_templates)]
            query = tpl.format(subject_name) + f" flashcard {card_number}"
            chunks = store.search(query, top_k=FlashcardAIConfig.CONTEXT_CHUNKS_PER_CARD)
            parts = [_chunk_text(c) for c in chunks]
            parts = [p for p in parts if p]
            if parts:
                return "\n\n".join(parts)

            # Fallback: use raw meta texts if FAISS index is empty
            texts = cls._load_meta_texts(meta_path)
            if not texts:
                return f"General study material about {subject_name}."
            start = (card_number - 1) % len(texts)
            return "\n\n".join(texts[start : start + 2])

        return fetcher

    # ------------------------------------------------------------------ #
    #  Progress JSON path                                                  #
    # ------------------------------------------------------------------ #
    @classmethod
    def _json_progress_path(cls, student_id: int, subject_id: int) -> str:
        FlashcardAIConfig.ensure_json_dir()
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        name = f"flashcards_s{student_id}_sub{subject_id}_{ts}.json"
        return os.path.join(FlashcardAIConfig.FLASHCARD_JSON_DIR, name)

    # ------------------------------------------------------------------ #
    #  Main: generate flashcards                                           #
    # ------------------------------------------------------------------ #
    @classmethod
    def generate_flashcards(cls, payload: dict) -> dict:
        """
        Expected payload:
        {
            "student_id": 1,
            "subject_id": 3,
            "subject_name": "a",
            "documents": [
                {"document_id": 5, "file_name": "IntroToHCI.pdf"},
                {"document_id": 4, "file_name": "HCI_Outline.pdf"}
            ]
        }

        Returns a list of {card_index, question, answer} objects
        in the same shape the frontend dummy data uses: {q, a}.
        """
        if not isinstance(payload, dict):
            raise ValueError("Request body must be a JSON object")

        student_id  = int(payload["student_id"])
        subject_id  = int(payload["subject_id"])
        subject_name = (payload.get("subject_name") or "").strip()
        num_cards   = int(payload.get("num_cards", FlashcardAIConfig.DEFAULT_NUM_CARDS))
        documents   = payload.get("documents") or []

        if num_cards < 1 or num_cards > FlashcardAIConfig.MAX_NUM_CARDS:
            raise ValueError(
                f"num_cards must be between 1 and {FlashcardAIConfig.MAX_NUM_CARDS}"
            )

        # Validate subject exists for this student
        subject = cls._get_subject(student_id, subject_id)
        if not subject_name:
            subject_name = subject.subject_name

        folder_name     = subject.folder_name
        embeddings_path = cls._embeddings_path(student_id, folder_name)
        meta_path       = os.path.join(embeddings_path, "subject_meta.json")

        if not os.path.exists(meta_path):
            raise ValueError(
                "No embeddings found for this subject. Upload and process documents first."
            )

        # Build FAISS store + context fetcher
        store           = SubjectVectorStore(student_id, folder_name)
        context_fetcher = cls._make_context_fetcher(store, subject_name, meta_path)

        # Progress JSON file (written incrementally as cards finish)
        json_path = cls._json_progress_path(student_id, subject_id)
        progress  = FlashcardProgressWriter(
            json_path,
            meta={
                "student_id":      student_id,
                "subject_id":      subject_id,
                "subject_name":    subject_name,
                "num_cards":       num_cards,
                "embeddings_path": embeddings_path,
                "total":           num_cards,
                "completed":       0,
                "documents":       documents,
            },
        )

        # Generate cards via orchestrator
        try:
            generated = cls._orchestrator.generate_all(
                context_fetcher=context_fetcher,
                subject_name=subject_name,
                num_cards=num_cards,
                progress_writer=progress,
            )
        except Exception as exc:
            progress.fail(str(exc))
            raise

        # Persist to DB — flashcard_sets + flashcards tables
        conn   = get_sql_connection()
        cursor = conn.cursor()

        cursor.execute(
            """INSERT INTO flashcard_sets
               (student_id, subject_id, subject_name, num_cards, embeddings_path)
               OUTPUT INSERTED.set_id
               VALUES (?, ?, ?, ?, ?)""",
            (student_id, subject_id, subject_name, num_cards, embeddings_path),
        )
        set_id = int(cursor.fetchone().set_id)
        conn.commit()

        cards_out = []
        for item in generated:
            cursor.execute(
                """INSERT INTO flashcards
                   (set_id, card_index, question, answer)
                   OUTPUT INSERTED.flashcard_id
                   VALUES (?, ?, ?, ?)""",
                (set_id, item["card_index"], item["question"], item["answer"]),
            )
            flashcard_id = int(cursor.fetchone().flashcard_id)
            cards_out.append({
                "flashcard_id": flashcard_id,
                "card_index":   item["card_index"],
                # Frontend-compatible keys
                "q": item["question"],
                "a": item["answer"],
            })

        conn.commit()
        conn.close()

        progress.finish(flashcard_set_id=set_id)

        return {
            "set_id":            set_id,
            "student_id":        student_id,
            "subject_id":        subject_id,
            "subject_name":      subject_name,
            "num_cards":         num_cards,
            "embeddings_path":   embeddings_path,
            "progress_json_path": json_path,
            "cards":             cards_out,
        }

    # ------------------------------------------------------------------ #
    #  Retrieve a previously generated set                                 #
    # ------------------------------------------------------------------ #
    @staticmethod
    def get_flashcard_set(set_id: int, student_id: int) -> dict:
        """Fetch a saved flashcard set from the database."""
        conn   = get_sql_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT set_id, student_id, subject_id, subject_name, num_cards, created_at "
            "FROM flashcard_sets WHERE set_id = ? AND student_id = ?",
            (set_id, student_id),
        )
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError("Flashcard set not found or does not belong to this student")

        cursor.execute(
            "SELECT flashcard_id, card_index, question, answer "
            "FROM flashcards WHERE set_id = ? ORDER BY card_index",
            (set_id,),
        )
        cards = [
            {
                "flashcard_id": r.flashcard_id,
                "card_index":   r.card_index,
                "q":            r.question,
                "a":            r.answer,
            }
            for r in cursor.fetchall()
        ]
        conn.close()

        return {
            "set_id":       row.set_id,
            "student_id":   row.student_id,
            "subject_id":   row.subject_id,
            "subject_name": row.subject_name,
            "num_cards":    row.num_cards,
            "created_at":   str(row.created_at),
            "cards":        cards,
        }

    # ------------------------------------------------------------------ #
    #  List all decks for a student                                        #
    # ------------------------------------------------------------------ #
    @staticmethod
    def list_decks(student_id: int) -> dict:
        conn   = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT set_id, subject_id, subject_name, num_cards, created_at "
            "FROM flashcard_sets WHERE student_id = ? ORDER BY created_at DESC",
            (student_id,),
        )
        decks = [
            {
                "set_id":       r.set_id,
                "subject_id":   r.subject_id,
                "subject_name": r.subject_name,
                "num_cards":    r.num_cards,
                "created_at":   str(r.created_at),
            }
            for r in cursor.fetchall()
        ]
        conn.close()
        return {"student_id": student_id, "decks": decks}

    # ------------------------------------------------------------------ #
    #  Create an empty deck manually (no AI)                              #
    # ------------------------------------------------------------------ #
    @staticmethod
    def create_deck(student_id: int, subject_id: int, subject_name: str) -> dict:
        # Validate subject ownership
        conn   = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT subject_name FROM subjects WHERE subject_id = ? AND student_id = ?",
            (subject_id, student_id),
        )
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError("Subject not found or does not belong to this student")

        if not subject_name:
            subject_name = row.subject_name

        cursor.execute(
            """INSERT INTO flashcard_sets
               (student_id, subject_id, subject_name, num_cards)
               OUTPUT INSERTED.set_id
               VALUES (?, ?, ?, 0)""",
            (student_id, subject_id, subject_name),
        )
        set_id = int(cursor.fetchone().set_id)
        conn.commit()
        conn.close()
        return {"set_id": set_id, "student_id": student_id, "subject_id": subject_id,
                "subject_name": subject_name, "num_cards": 0}

    # ------------------------------------------------------------------ #
    #  Delete a deck and all its cards                                    #
    # ------------------------------------------------------------------ #
    @staticmethod
    def delete_deck(student_id: int, deck_id: int):
        conn   = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT set_id FROM flashcard_sets WHERE set_id = ? AND student_id = ?",
            (deck_id, student_id),
        )
        if not cursor.fetchone():
            conn.close()
            raise ValueError("Deck not found or does not belong to this student")

        # Delete cards then deck (FK order)
        cursor.execute("DELETE FROM flashcards WHERE set_id = ?", (deck_id,))
        cursor.execute("DELETE FROM flashcard_sets WHERE set_id = ?", (deck_id,))
        conn.commit()
        conn.close()

    # ------------------------------------------------------------------ #
    #  Add a single card manually to a deck                              #
    # ------------------------------------------------------------------ #
    @staticmethod
    def add_card(student_id: int, deck_id: int, question: str, answer: str) -> dict:
        conn   = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT set_id, num_cards FROM flashcard_sets WHERE set_id = ? AND student_id = ?",
            (deck_id, student_id),
        )
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError("Deck not found or does not belong to this student")

        next_index = row.num_cards + 1
        cursor.execute(
            """INSERT INTO flashcards (set_id, card_index, question, answer)
               OUTPUT INSERTED.flashcard_id VALUES (?, ?, ?, ?)""",
            (deck_id, next_index, question, answer),
        )
        flashcard_id = int(cursor.fetchone().flashcard_id)
        cursor.execute(
            "UPDATE flashcard_sets SET num_cards = num_cards + 1 WHERE set_id = ?",
            (deck_id,),
        )
        conn.commit()
        conn.close()
        return {
            "flashcard_id": flashcard_id,
            "set_id":       deck_id,
            "card_index":   next_index,
            "q":            question,
            "a":            answer,
        }

    # ------------------------------------------------------------------ #
    #  Delete a single card                                               #
    # ------------------------------------------------------------------ #
    @staticmethod
    def delete_card(student_id: int, card_id: int):
        conn   = get_sql_connection()
        cursor = conn.cursor()
        # Verify ownership via join
        cursor.execute(
            "SELECT f.flashcard_id, f.set_id FROM flashcards f "
            "JOIN flashcard_sets s ON f.set_id = s.set_id "
            "WHERE f.flashcard_id = ? AND s.student_id = ?",
            (card_id, student_id),
        )
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError("Card not found or does not belong to this student")

        set_id = row.set_id
        cursor.execute("DELETE FROM flashcards WHERE flashcard_id = ?", (card_id,))
        cursor.execute(
            "UPDATE flashcard_sets SET num_cards = num_cards - 1 WHERE set_id = ? AND num_cards > 0",
            (set_id,),
        )
        conn.commit()
        conn.close()

    # ------------------------------------------------------------------ #
    #  Record a card review                                               #
    # ------------------------------------------------------------------ #
    @staticmethod
    def review_card(student_id: int, card_id: int, result: str) -> dict:
        """result: 'known' | 'unknown' — recorded in memory only (no reviews table)."""
        conn   = get_sql_connection()
        cursor = conn.cursor()
        # Verify ownership
        cursor.execute(
            "SELECT f.flashcard_id FROM flashcards f "
            "JOIN flashcard_sets s ON f.set_id = s.set_id "
            "WHERE f.flashcard_id = ? AND s.student_id = ?",
            (card_id, student_id),
        )
        if not cursor.fetchone():
            conn.close()
            raise ValueError("Card not found or does not belong to this student")
        conn.close()
        return {"flashcard_id": card_id, "result": result, "recorded": True}

    # ------------------------------------------------------------------ #
    #  Stats for a student                                                #
    # ------------------------------------------------------------------ #
    @staticmethod
    def get_stats(student_id: int) -> dict:
        conn   = get_sql_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT COUNT(*) AS total_decks FROM flashcard_sets WHERE student_id = ?",
            (student_id,),
        )
        total_decks = cursor.fetchone().total_decks

        cursor.execute(
            "SELECT ISNULL(SUM(num_cards), 0) AS total_cards "
            "FROM flashcard_sets WHERE student_id = ?",
            (student_id,),
        )
        total_cards = cursor.fetchone().total_cards

        conn.close()
        return {
            "student_id":  student_id,
            "total_decks": total_decks,
            "total_cards": total_cards,
        }

