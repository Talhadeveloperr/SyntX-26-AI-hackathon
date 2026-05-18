from abc import ABC, abstractmethod


class BaseAgent(ABC):
    @abstractmethod
    def can_handle(self, file_path: str, mime_type: str = None) -> bool:
        pass

    @abstractmethod
    def extract_text(self, file_path: str) -> str:
        pass
