# backend/app/services/subject_service.py
import os
import uuid

from werkzeug.utils import secure_filename

from app.database.connection import get_sql_connection
from app.subject_agents.orchestrator import SubjectOrchestrator
from app.subject_ai.config import SubjectAIConfig


class SubjectService:
    _orchestrator = SubjectOrchestrator()

    @staticmethod
    def _folder_name(subject_id: int) -> str:
        return f"Subj_{subject_id}"

    @staticmethod
    def _get_subject(student_id: int, subject_id: int):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT subject_id, student_id, subject_name, folder_name, created_at
            FROM subjects
            WHERE subject_id = ? AND student_id = ?
            """,
            (subject_id, student_id),
        )
        row = cursor.fetchone()
        conn.close()
        if not row:
            raise ValueError("Subject not found or does not belong to this student")
        return row

    # ── API 1: Add subject ─────────────────────────────────────────

    @classmethod
    def add_subject(cls, student_id: int, subject_name: str) -> dict:
        subject_name = (subject_name or "").strip()
        if not subject_name:
            raise ValueError("subject_name is required")

        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO subjects (student_id, subject_name, folder_name)
            OUTPUT INSERTED.subject_id, INSERTED.subject_name, INSERTED.created_at
            VALUES (?, ?, 'pending')
            """,
            (student_id, subject_name),
        )
        row = cursor.fetchone()
        subject_id = int(row.subject_id)
        folder_name = cls._folder_name(subject_id)

        cursor.execute(
            "UPDATE subjects SET folder_name = ? WHERE subject_id = ?",
            (folder_name, subject_id),
        )
        conn.commit()
        conn.close()

        docs_dir, emb_dir = SubjectAIConfig.ensure_subject_dirs(student_id, folder_name)

        return {
            "subject_id": subject_id,
            "subject_name": row.subject_name,
            "folder_name": folder_name,
            "documents_path": docs_dir,
            "embeddings_path": emb_dir,
            "created_at": row.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        }

    # ── API 2: List subjects ───────────────────────────────────────

    @staticmethod
    def get_subjects(student_id: int) -> list:
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT subject_id, subject_name, folder_name, created_at, updated_at
            FROM subjects
            WHERE student_id = ?
            ORDER BY created_at DESC
            """,
            (student_id,),
        )
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "subject_id": r.subject_id,
                "subject_name": r.subject_name,
                "folder_name": r.folder_name,
                "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else None,
                "updated_at": r.updated_at.strftime("%Y-%m-%d %H:%M:%S") if r.updated_at else None,
            }
            for r in rows
        ]

    # ── API 3: Upload documents to subject ───────────────────────────

    @classmethod
    def add_documents(cls, student_id: int, subject_id: int, files) -> dict:
        subject = cls._get_subject(student_id, subject_id)
        folder_name = subject.folder_name
        docs_dir, _ = SubjectAIConfig.ensure_subject_dirs(student_id, folder_name)

        conn = get_sql_connection()
        cursor = conn.cursor()
        uploaded = []

        for storage in files:
            if not storage or not storage.filename:
                continue

            original = secure_filename(storage.filename)
            ext = os.path.splitext(original)[1].lower()
            if ext not in SubjectAIConfig.ALLOWED_FILE_EXT:
                uploaded.append({
                    "file_name": original,
                    "skipped": True,
                    "reason": "unsupported file type",
                })
                continue

            unique_name = f"{uuid.uuid4().hex[:8]}_{original}"
            dest_path = os.path.join(docs_dir, unique_name)
            storage.save(dest_path)

            cursor.execute(
                """
                INSERT INTO subject_documents
                    (subject_id, student_id, file_name, file_path, mime_type, file_size)
                OUTPUT INSERTED.document_id
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    subject_id,
                    student_id,
                    original,
                    dest_path,
                    storage.mimetype,
                    os.path.getsize(dest_path),
                ),
            )
            document_id = int(cursor.fetchone().document_id)
            conn.commit()

            chunks, faiss_ids = cls._orchestrator.ingest_document(
                student_id,
                folder_name,
                document_id,
                dest_path,
                original,
                storage.mimetype,
            )

            for idx, (chunk, faiss_id) in enumerate(zip(chunks, faiss_ids)):
                cursor.execute(
                    """
                    INSERT INTO subject_document_chunks
                        (document_id, subject_id, chunk_index, chunk_text, faiss_id)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (document_id, subject_id, idx, chunk, faiss_id),
                )

            cursor.execute(
                """
                UPDATE subject_documents SET chunk_count = ?, embedded = 1
                WHERE document_id = ?
                """,
                (len(chunks), document_id),
            )
            cursor.execute(
                "UPDATE subjects SET updated_at = GETDATE() WHERE subject_id = ?",
                (subject_id,),
            )
            conn.commit()

            uploaded.append({
                "document_id": document_id,
                "file_name": original,
                "file_path": dest_path,
                "chunks_indexed": len(chunks),
            })

        conn.close()
        return {
            "subject_id": subject_id,
            "subject_name": subject.subject_name,
            "folder_name": folder_name,
            "documents_path": docs_dir,
            "uploaded_documents": uploaded,
        }

    # ── API 4: Subjects with document names ──────────────────────────

    @staticmethod
    def get_subjects_with_documents(student_id: int) -> list:
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT s.subject_id, s.subject_name, s.folder_name, s.created_at,
                   d.document_id, d.file_name, d.chunk_count, d.embedded, d.created_at AS doc_created_at
            FROM subjects s
            LEFT JOIN subject_documents d ON d.subject_id = s.subject_id
            WHERE s.student_id = ?
            ORDER BY s.created_at DESC, d.created_at DESC
            """,
            (student_id,),
        )
        rows = cursor.fetchall()
        conn.close()

        subjects_map = {}
        for r in rows:
            sid = r.subject_id
            if sid not in subjects_map:
                subjects_map[sid] = {
                    "subject_id": sid,
                    "subject_name": r.subject_name,
                    "folder_name": r.folder_name,
                    "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else None,
                    "documents": [],
                }
            if r.document_id:
                subjects_map[sid]["documents"].append({
                    "document_id": r.document_id,
                    "file_name": r.file_name,
                    "chunk_count": r.chunk_count,
                    "embedded": bool(r.embedded),
                    "created_at": r.doc_created_at.strftime("%Y-%m-%d %H:%M:%S") if r.doc_created_at else None,
                })

        return list(subjects_map.values())
