# backend/app/controllers/flashcards_controller.py
from flask import request, jsonify

from app.services.flashcard_services import FlashcardService


class FlashcardsController:

    # ── AI Generation ─────────────────────────────────────────────────────
    @staticmethod
    def generate():
        """
        POST /api/flashcards/generate
        Body: {student_id, subject_id, subject_name, documents, num_cards}
        """
        try:
            data = request.get_json(force=True, silent=False)
            if not isinstance(data, dict):
                return jsonify({"error": "JSON object body required"}), 400
            for field in ("student_id", "subject_id"):
                if data.get(field) is None:
                    return jsonify({"error": f"{field} is required"}), 400
            if not data.get("documents"):
                return jsonify({"error": "documents array is required"}), 400
            result = FlashcardService.generate_flashcards(data)
            return jsonify(result), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except RuntimeError as e:
            return jsonify({"error": str(e)}), 503
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ── Decks ──────────────────────────────────────────────────────────────
    @staticmethod
    def get_decks(student_id: int):
        try:
            return jsonify(FlashcardService.list_decks(student_id)), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def create_deck(student_id: int):
        try:
            data         = request.get_json(force=True, silent=True) or {}
            subject_id   = data.get("subject_id")
            subject_name = (data.get("subject_name") or "").strip()
            if subject_id is None:
                return jsonify({"error": "subject_id is required"}), 400
            return jsonify(FlashcardService.create_deck(student_id, int(subject_id), subject_name)), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def delete_deck(student_id: int, deck_id: int):
        try:
            FlashcardService.delete_deck(student_id, deck_id)
            return jsonify({"message": "Deck deleted"}), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ── Cards ──────────────────────────────────────────────────────────────
    @staticmethod
    def get_cards(student_id: int, deck_id: int):
        try:
            return jsonify(FlashcardService.get_flashcard_set(deck_id, student_id)), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def add_card(student_id: int, deck_id: int):
        try:
            data     = request.get_json(force=True, silent=True) or {}
            question = (data.get("question") or data.get("front_text") or "").strip()
            answer   = (data.get("answer")   or data.get("back_text")  or "").strip()
            if not question or not answer:
                return jsonify({"error": "question and answer are required"}), 400
            return jsonify(FlashcardService.add_card(student_id, deck_id, question, answer)), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def delete_card(student_id: int, card_id: int):
        try:
            FlashcardService.delete_card(student_id, card_id)
            return jsonify({"message": "Card deleted"}), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def review_card(student_id: int, card_id: int):
        try:
            data       = request.get_json(force=True, silent=True) or {}
            result_val = (data.get("result") or data.get("rating") or "known").strip()
            return jsonify(FlashcardService.review_card(student_id, card_id, result_val)), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ── Stats ──────────────────────────────────────────────────────────────
    @staticmethod
    def get_stats(student_id: int):
        try:
            return jsonify(FlashcardService.get_stats(student_id)), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

