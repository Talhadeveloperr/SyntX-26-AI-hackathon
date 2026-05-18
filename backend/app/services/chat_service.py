# backend/app/services/chat_service.py
import os
import uuid

from werkzeug.utils import secure_filename

from app.agents.orchestrator import AgentOrchestrator
from app.ai.config import AIConfig
from app.ai.ollama_llm import OllamaLLM
from app.ai.vector_store import VectorStore
from app.database.connection import get_sql_connection


class ChatService:
    _orchestrator = AgentOrchestrator()

    @staticmethod
    def create_session(student_id: int, title: str = "New Chat") -> int:
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO chat_sessions (student_id, title) OUTPUT INSERTED.session_id VALUES (?, ?)",
            (student_id, (title or "New Chat")[:255]),
        )
        session_id = int(cursor.fetchone().session_id)
        conn.commit()
        conn.close()
        AIConfig.ensure_dirs()
        return session_id

    @staticmethod
    def _validate_session(session_id: int, student_id: int) -> None:
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT session_id FROM chat_sessions WHERE session_id = ? AND student_id = ?",
            (session_id, student_id),
        )
        if not cursor.fetchone():
            conn.close()
            raise ValueError("Session not found or does not belong to this student")
        conn.close()

    @staticmethod
    def _session_title_from_prompt(prompt: str) -> str:
        words = (prompt or "").strip().split()
        if not words:
            return "New Chat"
        title = " ".join(words[:8])
        return title if len(title) <= 255 else title[:252] + "..."

    @staticmethod
    def _fetch_history(cursor, session_id: int) -> list:
        cursor.execute(
            "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
            (session_id,),
        )
        return [{"role": r.role, "content": r.content} for r in cursor.fetchall()]

    @classmethod
    def process_chat(cls, student_id, prompt, session_id=None, is_new_chat=False, files=None, model=None):
        AIConfig.ensure_dirs()
        prompt = (prompt or "").strip()
        has_files = bool(files)
        if not prompt and not has_files:
            raise ValueError("prompt or at least one file is required")

        created_new = False
        if is_new_chat or not session_id:
            title = cls._session_title_from_prompt(prompt) if prompt else "New Chat"
            session_id = cls.create_session(student_id, title)
            created_new = True
        else:
            cls._validate_session(session_id, student_id)

        conn = get_sql_connection()
        cursor = conn.cursor()
        uploaded_docs = []
        if has_files:
            uploaded_docs = cls._save_and_embed_files(cursor, conn, student_id, session_id, files)

        history = cls._fetch_history(cursor, session_id)
        context_chunks = VectorStore(session_id).search(prompt) if prompt else []
        system, rag_prompt = OllamaLLM.build_rag_prompt(
            prompt or "Summarize the uploaded study materials.", context_chunks, history
        )
        assistant_text = OllamaLLM.generate(rag_prompt, system=system, model=model)

        if prompt:
            cursor.execute(
                "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?)",
                (session_id, prompt),
            )
        cursor.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'assistant', ?)",
            (session_id, assistant_text),
        )
        cursor.execute("UPDATE chat_sessions SET updated_at = GETDATE() WHERE session_id = ?", (session_id,))
        conn.commit()
        conn.close()

        return {
            "session_id": session_id,
            "is_new_chat": created_new,
            "reply": assistant_text,
            "uploaded_documents": uploaded_docs,
            "sources": [
                {"file_name": c.get("file_name"), "score": round(c.get("score", 0), 4), "excerpt": (c.get("text") or "")[:300]}
                for c in context_chunks
            ],
        }

    @classmethod
    def _save_and_embed_files(cls, cursor, conn, student_id, session_id, files):
        results = []
        for storage in files:
            if not storage or not storage.filename:
                continue
            original = secure_filename(storage.filename)
            ext = os.path.splitext(original)[1].lower()
            if ext not in AIConfig.ALLOWED_FILE_EXT:
                results.append({"file_name": original, "skipped": True, "reason": "unsupported file type"})
                continue

            file_type = cls._orchestrator.classify_file_type(original, storage.mimetype)
            dest_dir = AIConfig.IMAGES_DIR if file_type == "image" else AIConfig.FILES_DIR
            dest_path = os.path.join(dest_dir, f"{session_id}_{uuid.uuid4().hex[:8]}_{original}")
            storage.save(dest_path)

            cursor.execute(
                """INSERT INTO chat_documents (session_id, student_id, file_name, file_path, file_type, mime_type, file_size)
                   OUTPUT INSERTED.document_id VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (session_id, student_id, original, dest_path, file_type, storage.mimetype, os.path.getsize(dest_path)),
            )
            document_id = int(cursor.fetchone().document_id)
            conn.commit()

            chunks, faiss_ids = cls._orchestrator.ingest_file(session_id, document_id, dest_path, original, storage.mimetype)
            for idx, (chunk, faiss_id) in enumerate(zip(chunks, faiss_ids)):
                cursor.execute(
                    "INSERT INTO chat_document_chunks (document_id, session_id, chunk_index, chunk_text, faiss_id) VALUES (?, ?, ?, ?, ?)",
                    (document_id, session_id, idx, chunk, faiss_id),
                )
            cursor.execute("UPDATE chat_documents SET chunk_count = ?, embedded = 1 WHERE document_id = ?", (len(chunks), document_id))
            conn.commit()
            results.append({"document_id": document_id, "file_name": original, "file_type": file_type, "chunks_indexed": len(chunks)})
        return results
