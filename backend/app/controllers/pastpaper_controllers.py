# backend/app/controllers/pastpaper_controllers.py
from flask import request, jsonify

from app.services.pastpaper_services import PastpaperService


class PastpaperController:

    # ── AI Analysis (Multipart Form Upload) ────────────────────────────────
    @staticmethod
    def analyze():
        """
        POST /api/pastpapers/analyze
        Body (multipart/form-data):
        - files: Array of files (images, PDFs, docx, etc.)
        - student_id: int (form field)
        - subject_id: int (form field)
        - subject_name: string (optional, form field)
        - paper_name: string (optional, form field)
        """
        try:
            # 1. Fetch form text parameters
            student_id_str = request.form.get("student_id")
            subject_id_str = request.form.get("subject_id")
            subject_name = (request.form.get("subject_name") or "").strip()
            paper_name = (request.form.get("paper_name") or "").strip()

            if not student_id_str or not subject_id_str:
                return jsonify({"error": "student_id and subject_id are required form fields"}), 400

            try:
                student_id = int(student_id_str)
                subject_id = int(subject_id_str)
            except ValueError:
                return jsonify({"error": "student_id and subject_id must be integers"}), 400

            # 2. Fetch uploaded files
            files = request.files.getlist("files")
            if not files or not any(f.filename for f in files):
                single = request.files.get("file")
                files = [single] if single and single.filename else []

            if not files:
                return jsonify({"error": "at least one past paper file (image/PDF/document) is required under 'files' or 'file'"}), 400

            # 3. Process analysis
            result = PastpaperService.analyze_uploaded_papers(
                student_id=student_id,
                subject_id=subject_id,
                subject_name_opt=subject_name,
                paper_name_opt=paper_name,
                files=files
            )
            return jsonify(result), 201

        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ── Retrieve pastpaper predictions/analyses ────────────────────────────
    @staticmethod
    def get_analyses(student_id: int):
        """
        GET /api/pastpapers/analyses
        List all pastpaper analyses for a student.
        """
        try:
            result = PastpaperService.get_analyses(student_id)
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def get_analysis_details(student_id: int, analysis_id: int):
        """
        GET /api/pastpapers/analyses/<analysis_id>
        Fetch details of a specific pastpaper analysis with predictions.
        """
        try:
            result = PastpaperService.get_analysis_details(student_id, analysis_id)
            return jsonify(result), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500
