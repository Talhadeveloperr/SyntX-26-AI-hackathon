# backend/app/controllers/flashcard_controllers.py
from flask import request, jsonify

from app.services.flashcard_services import FlashcardService


class FlashcardController:

    @staticmethod
    def generate():
        """
        POST /api/flashcards/generate
        Body:
        {
            "student_id": 1,
            "subject_id": 3,
            "subject_name": "a",
            "documents": [
                {"document_id": 5, "file_name": "IntroToHCI.pdf"},
                {"document_id": 4, "file_name": "HCI_Outline.pdf"}
            ],
            "num_cards": 10   <-- optional, defaults to 10
        }
        Returns:
        {
            "set_id": 1,
            "student_id": 1,
            "subject_id": 3,
            "subject_name": "a",
            "num_cards": 10,
            "cards": [
                {"flashcard_id": 1, "card_index": 1, "q": "...", "a": "..."},
                ...
            ]
        }
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

    @staticmethod
    def get_set():
        """
        GET /api/flashcards/<set_id>?student_id=1
        Returns a previously generated flashcard set with all cards.
        """
        try:
            set_id     = request.view_args.get("set_id")
            student_id = request.args.get("student_id")

            if set_id is None or student_id is None:
                return jsonify({"error": "set_id (path) and student_id (query param) are required"}), 400

            result = FlashcardService.get_flashcard_set(int(set_id), int(student_id))
            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
