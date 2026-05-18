# backend/app/routes/subject_routes.py
from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.subject_controllers import SubjectController

subject_bp = Blueprint("subjects", __name__)


# API 1 — Add a subject (creates Subjects_Docs/{user_id}/Subj_{id}/Documents + embeddings)
@subject_bp.route("", methods=["POST"])
# @jwt_required()
def add_subject():
    return SubjectController.add_subject()


# API 2 — List all subjects for the user
@subject_bp.route("", methods=["GET"])
# @jwt_required()
def get_subjects():
    return SubjectController.get_subjects()


# API 3 — Upload documents to a subject (saved + embedded)
@subject_bp.route("/<int:subject_id>/documents", methods=["POST"])
# @jwt_required()
def add_documents(subject_id):
    return SubjectController.add_documents(subject_id)


# API 4 — Subjects with document names
@subject_bp.route("/with-documents", methods=["GET"])
# @jwt_required()
def get_subjects_with_documents():
    return SubjectController.get_subjects_with_documents()
