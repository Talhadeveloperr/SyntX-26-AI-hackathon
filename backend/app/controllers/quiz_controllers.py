# backend/app/controllers/quiz_controllers.py
from flask import request, jsonify

from app.services.quiz_service import QuizService


class QuizController:

    @staticmethod
    def generate():
        try:
            data = request.get_json(force=True, silent=False)
            if not isinstance(data, dict):
                return jsonify({"error": "JSON object body required"}), 400

            for field in ("student_id", "subject_id", "num_questions"):
                if data.get(field) is None:
                    return jsonify({"error": f"{field} is required"}), 400

            result = QuizService.generate_quiz(data)
            return jsonify(result), 201

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except RuntimeError as e:
            return jsonify({"error": str(e)}), 503
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def submit():
        try:
            data = request.get_json(force=True, silent=False)
            if not isinstance(data, dict):
                return jsonify({"error": "JSON object body required"}), 400

            if data.get("quiz_id") is None or data.get("student_id") is None:
                return jsonify({"error": "quiz_id and student_id are required"}), 400

            if not data.get("answers"):
                return jsonify({"error": "answers array is required"}), 400

            result = QuizService.submit_quiz(data)
            return jsonify(result), 200

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
