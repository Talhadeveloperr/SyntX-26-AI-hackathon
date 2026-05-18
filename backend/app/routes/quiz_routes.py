# backend/app/routes/quiz_routes.py
from flask import Blueprint

from app.controllers.quiz_controllers import QuizController

quiz_bp = Blueprint("quiz", __name__)


@quiz_bp.route("/generate", methods=["POST"])
def generate_quiz():
    """
    POST JSON:
    {
      "student_id": 1,
      "subject_id": 3,
      "subject_name": "Biology",
      "difficulty": "Medium",
      "num_questions": 10
    }

    Per question: 4 LLM calls (1 correct + 3 wrong), different embeddings each call.
    Progress saved to backend/Quiz_generations/*.json after each question.
    """
    return QuizController.generate()


@quiz_bp.route("/submit", methods=["POST"])
def submit_quiz():
    return QuizController.submit()
