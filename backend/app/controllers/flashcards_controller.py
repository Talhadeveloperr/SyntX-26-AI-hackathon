# backend/app/controllers/flashcards_controller.py
from flask import request, jsonify
from app.services.flashcards_service import FlashcardsService


class FlashcardsController:

    # ── Decks ──────────────────────────────────────

    @staticmethod
    def get_decks(student_id):
        try:
            data = FlashcardsService.get_decks(student_id)
            return jsonify(data), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def create_deck(student_id):
        try:
            data = request.get_json()
            if not data or not data.get("name", "").strip():
                return jsonify({"error": "name is required"}), 400
            result = FlashcardsService.create_deck(student_id, data)
            return jsonify(result), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def delete_deck(student_id, deck_id):
        try:
            result = FlashcardsService.delete_deck(student_id, deck_id)
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ── Cards ───────────────────────────────────────

    @staticmethod
    def get_cards(student_id, deck_id):
        try:
            data = FlashcardsService.get_cards(student_id, deck_id)
            return jsonify(data), 200
        except PermissionError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def add_card(student_id, deck_id):
        try:
            data = request.get_json()
            if not data or not data.get("front_text", "").strip() or not data.get("back_text", "").strip():
                return jsonify({"error": "front_text and back_text are required"}), 400
            result = FlashcardsService.add_card(student_id, deck_id, data)
            return jsonify(result), 201
        except PermissionError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def delete_card(student_id, card_id):
        try:
            result = FlashcardsService.delete_card(student_id, card_id)
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def review_card(student_id, card_id):
        try:
            data = request.get_json()
            rating = data.get("rating") if data else None
            if rating not in ("Hard", "Medium", "Easy"):
                return jsonify({"error": "rating must be Hard, Medium, or Easy"}), 400
            result = FlashcardsService.review_card(student_id, card_id, rating)
            return jsonify(result), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ── Stats ───────────────────────────────────────

    @staticmethod
    def get_stats(student_id):
        try:
            data = FlashcardsService.get_stats(student_id)
            return jsonify(data), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
