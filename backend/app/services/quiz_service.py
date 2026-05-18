# backend/app/services/quiz_service.py
import json
import os
from datetime import datetime

from app.database.connection import get_sql_connection
from app.quiz_agents.orchestrator import QuizOrchestrator, QuizProgressWriter
from app.quiz_ai.config import QuizAIConfig
from app.subject_ai.config import SubjectAIConfig
from app.subject_ai.vector_store import SubjectVectorStore


def _chunk_text(item) -> str:
    """Safely extract text from a chunk dict or plain string."""
    if isinstance(item, dict):
        return (item.get("text") or "").strip()
    if isinstance(item, str):
        return item.strip()
    return ""


class QuizService:
    _orchestrator = QuizOrchestrator()

    @staticmethod
    def _get_subject(student_id: int, subject_id: int):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT subject_id, student_id, subject_name, folder_name FROM subjects WHERE subject_id = ? AND student_id = ?",
            (subject_id, student_id),
        )
        row = cursor.fetchone()
        conn.close()
        if not row:
            raise ValueError("Subject not found or does not belong to this student")
        return row

    @staticmethod
    def _embeddings_path(student_id: int, folder_name: str) -> str:
        return SubjectAIConfig.embeddings_dir(student_id, folder_name)

    @classmethod
    def _load_meta_texts(cls, meta_path: str) -> list[str]:
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        if not isinstance(meta, list):
            return []
        texts = []
        for m in meta:
            t = _chunk_text(m)
            if t:
                texts.append(t)
        return texts

    @classmethod
    def _make_context_fetcher(cls, store: SubjectVectorStore, subject_name: str, meta_path: str):
        """Returns a function(question_number, call_index) -> context string (unique embedding search each time)."""
        query_templates = [
            "key concepts and definitions {}",
            "important facts and details {}",
            "examples and applications {}",
            "summary and review points {}",
            "terminology and vocabulary {}",
            "processes and steps {}",
            "comparisons and differences {}",
            "causes and effects {}",
        ]

        def fetcher(question_number: int, call_index: int) -> str:
            tpl = query_templates[(question_number * 4 + call_index) % len(query_templates)]
            query = tpl.format(subject_name) + f" quiz Q{question_number} part{call_index + 1}"
            chunks = store.search(query, top_k=QuizAIConfig.CONTEXT_CHUNKS_PER_CALL)
            parts = [_chunk_text(c) for c in chunks]
            parts = [p for p in parts if p]
            if parts:
                return "\n\n".join(parts)

            texts = cls._load_meta_texts(meta_path)
            if not texts:
                return f"General study material about {subject_name}."
            start = (question_number * 3 + call_index) % len(texts)
            return "\n\n".join(texts[start : start + 2])

        return fetcher

    @classmethod
    def _json_progress_path(cls, student_id: int, subject_id: int) -> str:
        QuizAIConfig.ensure_json_dir()
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        name = f"quiz_s{student_id}_sub{subject_id}_{ts}.json"
        return os.path.join(QuizAIConfig.QUIZ_JSON_DIR, name)

    @classmethod
    def generate_quiz(cls, payload: dict) -> dict:
        if not isinstance(payload, dict):
            raise ValueError("Request body must be a JSON object")

        student_id = int(payload["student_id"])
        subject_id = int(payload["subject_id"])
        subject_name = (payload.get("subject_name") or "").strip()
        difficulty = (payload.get("difficulty") or "Medium").strip()
        num_questions = int(payload.get("num_questions", 10))

        if num_questions < 1 or num_questions > 50:
            raise ValueError("num_questions must be between 1 and 50")

        subject = cls._get_subject(student_id, subject_id)
        if not subject_name:
            subject_name = subject.subject_name

        folder_name = subject.folder_name
        embeddings_path = cls._embeddings_path(student_id, folder_name)
        meta_path = os.path.join(embeddings_path, "subject_meta.json")

        if not os.path.exists(meta_path):
            raise ValueError("No embeddings found for this subject. Upload documents first.")

        store = SubjectVectorStore(student_id, folder_name)
        context_fetcher = cls._make_context_fetcher(store, subject_name, meta_path)

        json_path = cls._json_progress_path(student_id, subject_id)
        progress = QuizProgressWriter(
            json_path,
            meta={
                "student_id": student_id,
                "subject_id": subject_id,
                "subject_name": subject_name,
                "difficulty": difficulty,
                "num_questions": num_questions,
                "embeddings_path": embeddings_path,
                "total": num_questions,
                "completed": 0,
            },
        )

        try:
            generated = cls._orchestrator.generate_all(
                context_fetcher=context_fetcher,
                subject_name=subject_name,
                difficulty=difficulty,
                num_questions=num_questions,
                progress_writer=progress,
            )
        except Exception as exc:
            progress.fail(str(exc))
            raise

        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO quizzes (student_id, subject_id, subject_name, difficulty, num_questions, embeddings_path)
               OUTPUT INSERTED.quiz_id VALUES (?, ?, ?, ?, ?, ?)""",
            (student_id, subject_id, subject_name, difficulty, num_questions, embeddings_path),
        )
        quiz_id = int(cursor.fetchone().quiz_id)
        conn.commit()

        questions_out = []
        for item in generated:
            options_json = json.dumps(item["options"], ensure_ascii=False)
            cursor.execute(
                """INSERT INTO quiz_questions (quiz_id, question_index, question_text, options_json, correct_option_id)
                   OUTPUT INSERTED.question_id VALUES (?, ?, ?, ?, ?)""",
                (quiz_id, item["question_index"], item["question"], options_json, item["correct_option_id"]),
            )
            question_id = int(cursor.fetchone().question_id)
            questions_out.append({
                "question_id": question_id,
                "question_index": item["question_index"],
                "question": item["question"],
                "options": item["options"],
                "correct_option_id": item["correct_option_id"],
            })

        conn.commit()
        conn.close()

        progress.finish(quiz_id=quiz_id)

        return {
            "quiz_id": quiz_id,
            "student_id": student_id,
            "subject_id": subject_id,
            "subject_name": subject_name,
            "difficulty": difficulty,
            "num_questions": num_questions,
            "embeddings_path": embeddings_path,
            "progress_json_path": json_path,
            "llm_calls_per_question": QuizAIConfig.CALLS_PER_QUESTION,
            "questions": questions_out,
        }

    @staticmethod
    def submit_quiz(payload: dict) -> dict:
        if not isinstance(payload, dict):
            raise ValueError("Request body must be a JSON object")

        quiz_id = int(payload["quiz_id"])
        student_id = int(payload["student_id"])
        answers = payload.get("answers") or []
        if not answers:
            raise ValueError("answers array is required")

        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT quiz_id, student_id FROM quizzes WHERE quiz_id = ?", (quiz_id,))
        quiz = cursor.fetchone()
        if not quiz:
            conn.close()
            raise ValueError("Quiz not found")
        if int(quiz.student_id) != student_id:
            conn.close()
            raise ValueError("Quiz does not belong to this student")

        cursor.execute("SELECT question_id, correct_option_id FROM quiz_questions WHERE quiz_id = ?", (quiz_id,))
        correct_map = {r.question_id: int(r.correct_option_id) for r in cursor.fetchall()}

        score = 0
        answer_rows = []
        for ans in answers:
            if not isinstance(ans, dict):
                raise ValueError("Each answer must be an object with question_id and selected_option_id")
            qid = int(ans["question_id"])
            selected = int(ans["selected_option_id"])
            if qid not in correct_map:
                conn.close()
                raise ValueError(f"Invalid question_id: {qid}")
            is_correct = selected == correct_map[qid]
            if is_correct:
                score += 1
            answer_rows.append((qid, selected, is_correct))

        total = len(correct_map)
        percentage = round((score / total) * 100, 2) if total else 0.0

        cursor.execute(
            """INSERT INTO quiz_submissions (quiz_id, student_id, score, total_questions, percentage)
               OUTPUT INSERTED.submission_id VALUES (?, ?, ?, ?, ?)""",
            (quiz_id, student_id, score, total, percentage),
        )
        submission_id = int(cursor.fetchone().submission_id)

        for qid, selected, is_correct in answer_rows:
            cursor.execute(
                "INSERT INTO quiz_submission_answers (submission_id, question_id, selected_option_id, is_correct) VALUES (?, ?, ?, ?)",
                (submission_id, qid, selected, 1 if is_correct else 0),
            )

        conn.commit()
        conn.close()

        return {
            "submission_id": submission_id,
            "quiz_id": quiz_id,
            "student_id": student_id,
            "score": score,
            "total_questions": total,
            "percentage": percentage,
        }
