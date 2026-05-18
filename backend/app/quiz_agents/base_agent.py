from abc import ABC, abstractmethod


class BaseQuizAgent(ABC):
    @abstractmethod
    def run(self, **kwargs) -> dict:
        pass
