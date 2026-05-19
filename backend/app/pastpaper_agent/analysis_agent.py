# backend/app/pastpaper_agent/analysis_agent.py
from app.pastpaper_agent.base_agent import BasePastpaperAgent
from app.pastpaper_ai.llm import PastpaperLLM


class PastpaperAnalysisAgent(BasePastpaperAgent):
    """
    LLM agent responsible for analyzing past exam papers to extract and predict
    probable future questions, topics, marks, and confidence scores.
    """

    def run(self, content: str, subject_name: str, **kwargs) -> list[dict]:
        return PastpaperLLM.analyze_paper(
            content=content,
            subject_name=subject_name
        )
