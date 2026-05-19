# backend/app/services/pastpaper_services.py
import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename

from app.database.connection import get_sql_connection
from app.pastpaper_agent.orchestrator import PastpaperOrchestrator
from app.pastpaper_ai.config import PastpaperAIConfig


class PastpaperService:
    _orchestrator = PastpaperOrchestrator()

    @staticmethod
    def _get_subject(student_id: int, subject_id: int):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT subject_id, student_id, subject_name "
            "FROM subjects WHERE subject_id = ? AND student_id = ?",
            (subject_id, student_id),
        )
        row = cursor.fetchone()
        conn.close()
        if not row:
            raise ValueError("Subject not found or does not belong to this student")
        return row

    @classmethod
    def analyze_uploaded_papers(cls, student_id: int, subject_id: int, subject_name_opt: str, paper_name_opt: str, files: list) -> dict:
        """
        Accepts raw uploaded files, saves them in backend/Past_papers,
        extracts text and runs AI prediction, and saves results to DB.
        """
        # 1. Validate subject ownership
        subject = cls._get_subject(student_id, subject_id)
        subject_name = (subject_name_opt or subject.subject_name).strip()

        # 2. Save uploaded files to backend/Past_papers
        PastpaperAIConfig.ensure_pastpapers_dir()
        
        saved_file_paths = []
        original_filenames = []

        for storage in files:
            if not storage or not storage.filename:
                continue

            original = secure_filename(storage.filename)
            ext = os.path.splitext(original)[1].lower()
            
            # Allow images and documents
            all_allowed = PastpaperAIConfig.ALLOWED_IMAGE_EXT | PastpaperAIConfig.ALLOWED_DOC_EXT
            if ext not in all_allowed:
                continue

            unique_name = f"{uuid.uuid4().hex[:8]}_{original}"
            dest_path = os.path.join(PastpaperAIConfig.PAST_PAPERS_DIR, unique_name)
            storage.save(dest_path)
            
            saved_file_paths.append(dest_path)
            original_filenames.append(original)

        if not saved_file_paths:
            raise ValueError("No valid image or document files were uploaded")

        # Create paper display name from files if not provided
        paper_name = (paper_name_opt or ", ".join(original_filenames[:3])).strip()

        # 3. Analyze all files
        predictions = cls._orchestrator.analyze_paper_files(saved_file_paths, subject_name)

        # 4. Save results to SQL database (pastpaper_analyses + predicted_questions)
        conn = get_sql_connection()
        cursor = conn.cursor()

        try:
            # We store comma-separated paths or the first path
            primary_path = saved_file_paths[0] if saved_file_paths else ""
            
            # Insert into pastpaper_analyses
            cursor.execute(
                """INSERT INTO pastpaper_analyses
                   (student_id, subject_id, subject_name, paper_name, file_path)
                   OUTPUT INSERTED.analysis_id
                   VALUES (?, ?, ?, ?, ?)""",
                (student_id, subject_id, subject_name, paper_name, primary_path),
            )
            analysis_id = int(cursor.fetchone().analysis_id)
            conn.commit()

            # Insert predicted questions
            predictions_out = []
            for item in predictions:
                cursor.execute(
                    """INSERT INTO predicted_questions
                       (analysis_id, question_text, total_marks, confidence, topic)
                       OUTPUT INSERTED.prediction_id
                       VALUES (?, ?, ?, ?, ?)""",
                    (analysis_id, item["question_text"], item["total_marks"], item["confidence"], item["topic"]),
                )
                prediction_id = int(cursor.fetchone().prediction_id)
                predictions_out.append({
                    "prediction_id": prediction_id,
                    "question_text": item["question_text"],
                    "total_marks": item["total_marks"],
                    "confidence": item["confidence"],
                    "topic": item["topic"]
                })

            conn.commit()
            
            return {
                "analysis_id": analysis_id,
                "student_id": student_id,
                "subject_id": subject_id,
                "subject_name": subject_name,
                "paper_name": paper_name,
                "uploaded_files": original_filenames,
                "predictions": predictions_out,
                "analyzed_at": datetime.utcnow().isoformat() + "Z"
            }
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    @staticmethod
    def get_analyses(student_id: int) -> dict:
        """Fetch list of all pastpaper analyses for a student."""
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT analysis_id, subject_id, subject_name, paper_name, file_path, analyzed_at "
            "FROM pastpaper_analyses WHERE student_id = ? ORDER BY analyzed_at DESC",
            (student_id,),
        )
        analyses = [
            {
                "analysis_id": r.analysis_id,
                "subject_id": r.subject_id,
                "subject_name": r.subject_name,
                "paper_name": r.paper_name,
                "file_name": os.path.basename(r.file_path) if r.file_path else "",
                "analyzed_at": str(r.analyzed_at)
            }
            for r in cursor.fetchall()
        ]
        conn.close()
        return {"student_id": student_id, "analyses": analyses}

    @staticmethod
    def get_analysis_details(student_id: int, analysis_id: int) -> dict:
        """Fetch details and predicted questions for a specific pastpaper analysis."""
        conn = get_sql_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT analysis_id, student_id, subject_id, subject_name, paper_name, file_path, analyzed_at "
            "FROM pastpaper_analyses WHERE analysis_id = ? AND student_id = ?",
            (analysis_id, student_id),
        )
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError("Analysis not found or does not belong to this student")

        cursor.execute(
            "SELECT prediction_id, question_text, total_marks, confidence, topic "
            "FROM predicted_questions WHERE analysis_id = ? ORDER BY prediction_id",
            (analysis_id,),
        )
        predictions = [
            {
                "prediction_id": r.prediction_id,
                "question_text": r.question_text,
                "total_marks": r.total_marks,
                "confidence": float(r.confidence),
                "topic": r.topic
            }
            for r in cursor.fetchall()
        ]
        conn.close()

        return {
            "analysis_id": row.analysis_id,
            "student_id": row.student_id,
            "subject_id": row.subject_id,
            "subject_name": row.subject_name,
            "paper_name": row.paper_name,
            "file_name": os.path.basename(row.file_path) if row.file_path else "",
            "analyzed_at": str(row.analyzed_at),
            "predictions": predictions
        }
        
