from app.quiz_agents.base_agent import BaseQuizAgent
from app.quiz_ai.llm import QuizLLM


class CorrectAnswerAgent(BaseQuizAgent):
    """LLM call #1 per question — question + correct answer."""

    def run(self, context, subject_name, difficulty, question_number, total_questions, **_kwargs):
        return QuizLLM.generate_correct(
            context=context,
            subject_name=subject_name,
            difficulty=difficulty,
            question_number=question_number,
            total_questions=total_questions,
        )


class WrongAnswerAgent(BaseQuizAgent):
    """LLM calls #2–4 per question — one wrong option each (parallel)."""

    def run(self, context, subject_name, difficulty, question_number, wrong_index, **_kwargs):
        return QuizLLM.generate_wrong(
            context=context,
            subject_name=subject_name,
            difficulty=difficulty,
            question_number=question_number,
            wrong_index=wrong_index,
        )
