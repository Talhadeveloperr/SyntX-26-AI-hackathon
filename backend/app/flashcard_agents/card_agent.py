# backend/app/flashcard_agents/card_agent.py
from app.flashcard_agents.base_agent import BaseFlashcardAgent
from app.flashcard_ai.llm import FlashcardLLM


class FlashcardAgent(BaseFlashcardAgent):
    """One LLM call per flashcard — returns {question, answer}."""

    def run(self, context: str, subject_name: str, card_number: int, total_cards: int, **_kwargs) -> dict:
        return FlashcardLLM.generate_flashcard(
            context=context,
            subject_name=subject_name,
            card_number=card_number,
            total_cards=total_cards,
        )
