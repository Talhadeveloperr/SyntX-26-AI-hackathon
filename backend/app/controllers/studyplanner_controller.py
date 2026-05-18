# backend/app/controllers/studyplanner_controller.py
from flask import request, jsonify
from app.services.studypalnner_service import StudyPlannerService


class StudyPlannerController:

    # ── Deadlines ──────────────────────────────

    @staticmethod
    def get_deadlines(student_id):
        try:
            data = StudyPlannerService.get_deadlines(student_id)
            return jsonify(data), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def add_deadline(student_id):
        try:
            data = request.get_json()
            if not data or not data.get("subject_name") or not data.get("deadline_date"):
                return jsonify({"error": "subject_name and deadline_date are required"}), 400
            result = StudyPlannerService.add_deadline(student_id, data)
            return jsonify(result), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def update_deadline(student_id, deadline_id):
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400
            result = StudyPlannerService.update_deadline(student_id, deadline_id, data)
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def delete_deadline(student_id, deadline_id):
        try:
            result = StudyPlannerService.delete_deadline(student_id, deadline_id)
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ── Sessions ───────────────────────────────

    @staticmethod
    def get_sessions(student_id):
        try:
            data = StudyPlannerService.get_sessions(student_id)
            return jsonify(data), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def add_session(student_id):
        try:
            data = request.get_json()
            if not data or not data.get("subject_name") or not data.get("session_date"):
                return jsonify({"error": "subject_name and session_date are required"}), 400
            result = StudyPlannerService.add_session(student_id, data)
            return jsonify(result), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ── Stats ──────────────────────────────────

    @staticmethod
    def get_stats(student_id):
        try:
            data = StudyPlannerService.get_stats(student_id)
            return jsonify(data), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
