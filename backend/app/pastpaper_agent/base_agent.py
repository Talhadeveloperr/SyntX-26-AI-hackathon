# backend/app/pastpaper_agent/base_agent.py
from abc import ABC, abstractmethod


class BasePastpaperAgent(ABC):
    @abstractmethod
    def run(self, **kwargs) -> dict:
        pass
