# backend/app/controllers/chat_controllers.py
from flask import request, jsonify

from app.services.chat_service import ChatService


def _parse_bool(value) -> bool:
    if value is None:
        return False
    return str(value).strip().lower() in ("1", "true", "yes", "on")


class ChatController:

    @staticmethod
    def _student_id() -> int:
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
    def send_message():
        try:
            prompt = (request.form.get("prompt") or "").strip()
            session_id_raw = request.form.get("session_id")
            is_new_chat = _parse_bool(request.form.get("is_new_chat"))
            model = request.form.get("model") or None
            session_id = int(session_id_raw) if session_id_raw else None

            files = request.files.getlist("files")
            if not files or not any(f.filename for f in files):
                single = request.files.get("file")
                files = [single] if single and single.filename else []

            result = ChatService.process_chat(
                student_id=ChatController._student_id(),
                prompt=prompt,
                session_id=session_id,
                is_new_chat=is_new_chat,
                files=files or None,
                model=model,
            )
            return jsonify(result), 200
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
