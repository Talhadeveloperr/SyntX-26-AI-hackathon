# backend/app/controllers/subject_controllers.py
from flask import request, jsonify

from app.services.subject_service import SubjectService


class SubjectController:

    @staticmethod
    def _student_id() -> int:
        data = request.get_json(silent=True) or {}
        if request.args.get("student_id"):
            return int(request.args["student_id"])
        if data.get("student_id"):
            return int(data["student_id"])
        if request.form.get("student_id"):
            return int(request.form["student_id"])
        try:
            from flask_jwt_extended import get_jwt_identity
            identity = get_jwt_identity()
            if identity and isinstance(identity, dict) and identity.get("student_id"):
                return int(identity["student_id"])
        except Exception:
            pass
        return 1

    @staticmethod
    def add_subject():
        try:
            data = request.get_json() or {}
            name = data.get("subject_name", "").strip()
            if not name:
                return jsonify({"error": "subject_name is required"}), 400
            result = SubjectService.add_subject(SubjectController._student_id(), name)
            return jsonify(result), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def get_subjects():
        try:
            data = SubjectService.get_subjects(SubjectController._student_id())
            return jsonify(data), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def add_documents(subject_id: int):
        try:
            files = request.files.getlist("files")
            if not files or not any(f.filename for f in files):
                single = request.files.get("file")
                files = [single] if single and single.filename else []
            if not files:
                return jsonify({"error": "at least one file is required"}), 400

            result = SubjectService.add_documents(
                SubjectController._student_id(), subject_id, files
            )
            return jsonify(result), 201
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def get_subjects_with_documents():
        try:
            data = SubjectService.get_subjects_with_documents(SubjectController._student_id())
            return jsonify(data), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
