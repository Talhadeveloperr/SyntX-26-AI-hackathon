# backend/app/routes/pastpaper_routes.py
from flask import Blueprint
from app.controllers.pastpaper_controllers import PastpaperController

pastpaper_bp = Blueprint("pastpapers", __name__)


def _sid():
    # Helper to fetch student ID. Defaulting to 1 as per current routing pattern.
    # return get_jwt_identity()["student_id"]
    return 1


# ── AI Analysis ──────────────────────────────────────────

@pastpaper_bp.route("/analyze", methods=["POST"])
def analyze_pastpaper():
    """
    POST /api/pastpapers/analyze
    Body:
    {
      "student_id": 1,
      "subject_id": 3,
      "subject_name": "a",
      "file_name": "IntroToHCI_exam.pdf",
      "paper_name": "HCI 2025 Midterm"
    }
    """
    return PastpaperController.analyze()


# ── Retrieve pastpaper predictions/analyses ─────────────

@pastpaper_bp.route("/analyses", methods=["GET"])
def get_analyses():
    """
    GET /api/pastpapers/analyses
    """
    return PastpaperController.get_analyses(_sid())


@pastpaper_bp.route("/analyses/<int:analysis_id>", methods=["GET"])
def get_analysis_details(analysis_id):
    """
    GET /api/pastpapers/analyses/<analysis_id>
    """
    return PastpaperController.get_analysis_details(_sid(), analysis_id)
