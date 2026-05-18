# backend/app/routes/studyplanner_routes.py
from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.controllers.studyplanner_controller import StudyPlannerController

studyplanner_bp = Blueprint("studyplanner", __name__)


def _sid():
    """Extract student_id from JWT identity."""
    #return get_jwt_identity()["student_id"]
    return 1

# ── Deadlines ──────────────────────────────────────────

@studyplanner_bp.route("/deadlines", methods=["GET"])
#@jwt_required()
def get_deadlines():
    return StudyPlannerController.get_deadlines(_sid())


@studyplanner_bp.route("/deadlines", methods=["POST"])
#@jwt_required()
def add_deadline():
    return StudyPlannerController.add_deadline(_sid())


@studyplanner_bp.route("/deadlines/<int:deadline_id>", methods=["PUT"])
#@jwt_required()
def update_deadline(deadline_id):
    return StudyPlannerController.update_deadline(_sid(), deadline_id)


@studyplanner_bp.route("/deadlines/<int:deadline_id>", methods=["DELETE"])
#@jwt_required()
def delete_deadline(deadline_id):
    return StudyPlannerController.delete_deadline(_sid(), deadline_id)


# ── Sessions ───────────────────────────────────────────

@studyplanner_bp.route("/sessions", methods=["GET"])
#@jwt_required()
def get_sessions():
    return StudyPlannerController.get_sessions(_sid())


@studyplanner_bp.route("/sessions", methods=["POST"])
#@jwt_required()
def add_session():
    return StudyPlannerController.add_session(_sid())


# ── Stats ──────────────────────────────────────────────

@studyplanner_bp.route("/stats", methods=["GET"])
#@jwt_required()
def get_stats():
    return StudyPlannerController.get_stats(_sid())
