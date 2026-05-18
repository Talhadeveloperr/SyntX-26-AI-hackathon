# backend/app/flashcard_agents/base_agent.py
from abc import ABC, abstractmethod


class BaseFlashcardAgent(ABC):
    @abstractmethod
    def run(self, **kwargs) -> dict:
        pass
