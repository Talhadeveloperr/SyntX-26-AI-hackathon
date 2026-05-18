# backend/app/routes/chat_routes.py
from flask import Blueprint
from flask_jwt_extended import jwt_required

from app.controllers.chat_controllers import ChatController

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/message", methods=["POST"])
# @jwt_required()
def send_message():
    """
    Single chat endpoint.

    New chat (fresh embeddings / FAISS index):
      - omit session_id, OR
      - send is_new_chat=true

    Existing chat (reuse embeddings for that session):
      - send session_id=<id> and is_new_chat=false (or omit is_new_chat)
    """
    return ChatController.send_message()
