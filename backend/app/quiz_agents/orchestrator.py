import json
import os
import random
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

from app.quiz_agents.question_agent import CorrectAnswerAgent, WrongAnswerAgent
from app.quiz_ai.config import QuizAIConfig


class QuizProgressWriter:
    """Append each completed question to a JSON file during generation."""

    def __init__(self, filepath: str, meta: dict):
        self.filepath = filepath
        self._lock = threading.Lock()
        self._data = {
            "status": "in_progress",
            "started_at": datetime.utcnow().isoformat() + "Z",
            "questions": [],
            **meta,
        }
        self._flush()

    def add_question(self, question_payload: dict):
        with self._lock:
            self._data["questions"].append(question_payload)
            self._data["completed"] = len(self._data["questions"])
            self._flush()

    def finish(self, quiz_id: int = None):
        with self._lock:
            self._data["status"] = "completed"
            self._data["finished_at"] = datetime.utcnow().isoformat() + "Z"
            if quiz_id is not None:
                self._data["quiz_id"] = quiz_id
            self._flush()

    def fail(self, error: str):
        with self._lock:
            self._data["status"] = "failed"
            self._data["error"] = error
            self._flush()

    def _flush(self):
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        with open(self.filepath, "w", encoding="utf-8") as f:
            json.dump(self._data, f, ensure_ascii=False, indent=2)


class QuizOrchestrator:
    """
    Per question:
      - 4 parallel LLM calls (1 correct + 3 wrong), each with different embedding context
      - Save to JSON immediately after the question is assembled
    """

    def __init__(self):
        self._correct_agent = CorrectAnswerAgent()
        self._wrong_agent = WrongAnswerAgent()

    def generate_all(
        self,
        context_fetcher,
        subject_name: str,
        difficulty: str,
        num_questions: int,
        progress_writer: QuizProgressWriter,
    ) -> list[dict]:
        results = []
        for q_index in range(num_questions):
            question_number = q_index + 1
            item = self._generate_one_question(
                context_fetcher=context_fetcher,
                subject_name=subject_name,
                difficulty=difficulty,
                question_number=question_number,
                total_questions=num_questions,
            )
            progress_writer.add_question(item)
            results.append(item)
        return results

    def _generate_one_question(
        self,
        context_fetcher,
        subject_name,
        difficulty,
        question_number,
        total_questions,
    ) -> dict:
        # 4 different embedding contexts — 4 parallel LLM calls
        contexts = [context_fetcher(question_number, i) for i in range(4)]

        def _correct_task():
            return self._correct_agent.run(
                context=contexts[0],
                subject_name=subject_name,
                difficulty=difficulty,
                question_number=question_number,
                total_questions=total_questions,
            )

        def _run_retry(fn):
            last_exc = None
            for _ in range(QuizAIConfig.LLM_MAX_RETRIES):
                try:
                    return fn()
                except Exception as exc:
                    last_exc = exc
            raise last_exc

        # Step 1: question + correct answer (must succeed before distractors)
        correct_result = _run_retry(_correct_task)
        question_text = correct_result["question"]
        correct_text = correct_result["answer"]

        def _wrong_task(wrong_index, ctx):
            return self._wrong_agent.run(
                context=ctx,
                subject_name=subject_name,
                difficulty=difficulty,
                question_number=question_number,
                wrong_index=wrong_index,
                question_text=question_text,
            )

        wrong_texts = [None, None, None]

        # Step 2: 3 wrong answers in parallel (each with its own embedding context)
        def _wrong_job(i):
            return _run_retry(lambda: _wrong_task(i, contexts[i]))

        with ThreadPoolExecutor(max_workers=3) as pool:
            f_wrongs = {pool.submit(_wrong_job, i): i - 1 for i in range(1, 4)}
            for future in as_completed(f_wrongs):
                wrong_texts[f_wrongs[future]] = future.result()["answer"]

        options_raw = [
            {"id": 1, "text": correct_text, "is_correct": True},
            {"id": 2, "text": wrong_texts[0], "is_correct": False},
            {"id": 3, "text": wrong_texts[1], "is_correct": False},
            {"id": 4, "text": wrong_texts[2], "is_correct": False},
        ]
        random.shuffle(options_raw)

        options = []
        correct_option_id = None
        for i, opt in enumerate(options_raw, start=1):
            options.append({"id": i, "text": opt["text"]})
            if opt["is_correct"]:
                correct_option_id = i

        return {
            "question_index": question_number,
            "question": question_text,
            "options": options,
            "correct_option_id": correct_option_id,
            "generation": {
                "calls": 4,
                "flow": "1 correct then 3 wrong (parallel)",
                "contexts_used": [(c or "")[:200] for c in contexts],
            },
        }
