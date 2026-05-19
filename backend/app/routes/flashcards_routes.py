# backend/app/routes/flashcards_routes.py
from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.controllers.flashcards_controller import FlashcardsController

flashcards_bp = Blueprint("flashcards", __name__)


def _sid():
    #return get_jwt_identity()["student_id"]
    return 1


# ── AI Generation ──────────────────────────────────────────

@flashcards_bp.route("/generate", methods=["POST"])
#@jwt_required()
def generate_flashcards():
    """
    POST /api/flashcards/generate
    Body:
    {
      "student_id": 1,
      "subject_id": 3,
      "subject_name": "a",
      "documents": [
        {"document_id": 5, "file_name": "IntroToHCI.pdf"},
        {"document_id": 4, "file_name": "HCI_Outline.pdf"}
      ],
      "num_cards": 10
    }
    Returns cards as [{flashcard_id, card_index, q, a}, ...]
    """
    return FlashcardsController.generate()


# ── Decks ──────────────────────────────────────────────────

@flashcards_bp.route("/decks", methods=["GET"])
#@jwt_required()
def get_decks():
    return FlashcardsController.get_decks(_sid())


@flashcards_bp.route("/decks", methods=["POST"])
#@jwt_required()
def create_deck():
    return FlashcardsController.create_deck(_sid())


@flashcards_bp.route("/decks/<int:deck_id>", methods=["DELETE"])
#@jwt_required()
def delete_deck(deck_id):
    return FlashcardsController.delete_deck(_sid(), deck_id)


# ── Cards ───────────────────────────────────────────────────

@flashcards_bp.route("/decks/<int:deck_id>/cards", methods=["GET"])
#@jwt_required()
def get_cards(deck_id):
    return FlashcardsController.get_cards(_sid(), deck_id)


@flashcards_bp.route("/decks/<int:deck_id>/cards", methods=["POST"])
#@jwt_required()
def add_card(deck_id):
    return FlashcardsController.add_card(_sid(), deck_id)


@flashcards_bp.route("/cards/<int:card_id>", methods=["DELETE"])
#@jwt_required()
def delete_card(card_id):
    return FlashcardsController.delete_card(_sid(), card_id)


@flashcards_bp.route("/cards/<int:card_id>/review", methods=["POST"])
#@jwt_required()
def review_card(card_id):
    return FlashcardsController.review_card(_sid(), card_id)


# ── Stats ────────────────────────────────────────────────────

@flashcards_bp.route("/stats", methods=["GET"])
#@jwt_required()
def get_stats():
    return FlashcardsController.get_stats(_sid())
