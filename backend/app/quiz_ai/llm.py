import json
import re
import requests

from app.quiz_ai.config import QuizAIConfig

_PLACEHOLDER_PATTERNS = [
    r"^the question text$",
    r"^the correct answer option text$",
    r"^one plausible wrong answer option text",
    r"^return json",
]


class QuizLLM:

    @staticmethod
    def _call_ollama(prompt: str, system: str) -> str:
        url = f"{QuizAIConfig.OLLAMA_BASE_URL}/api/generate"
        payload = {
            "model": QuizAIConfig.OLLAMA_MODEL,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "format": "json",
            "options": {"temperature": QuizAIConfig.TEMPERATURE},
        }
        response = requests.post(url, json=payload, timeout=QuizAIConfig.REQUEST_TIMEOUT)
        response.raise_for_status()
        return (response.json().get("response") or "").strip()

    @staticmethod
    def _extract_braced_object(text: str) -> str:
        start = text.find("{")
        if start == -1:
            raise ValueError("No JSON object found in LLM response")
        depth = 0
        in_string = False
        escape = False
        for i in range(start, len(text)):
            ch = text[i]
            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
                continue
            if ch == '"':
                in_string = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[start : i + 1]
        raise ValueError("Unclosed JSON object in LLM response")

    @staticmethod
    def _repair_json_string(s: str) -> str:
        s = s.strip()
        s = re.sub(r",\s*}", "}", s)
        s = re.sub(r",\s*]", "]", s)
        s = s.replace("\u201c", '"').replace("\u201d", '"').replace("\u2019", "'")
        return s

    @staticmethod
    def _parse_json(raw: str) -> dict:
        text = (raw or "").strip()
        if not text:
            raise ValueError("Empty LLM response")

        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
            text = re.sub(r"\s*```$", "", text)

        candidates = [text]
        try:
            candidates.append(QuizLLM._extract_braced_object(text))
        except ValueError:
            pass

        last_error = None
        for candidate in candidates:
            for attempt in (candidate, QuizLLM._repair_json_string(candidate)):
                try:
                    data = json.loads(attempt)
                    if isinstance(data, str):
                        data = json.loads(data)
                    if isinstance(data, dict):
                        return data
                except json.JSONDecodeError as exc:
                    last_error = exc

        parsed = QuizLLM._regex_fallback_parse(text)
        if parsed:
            return parsed

        raise ValueError(f"Could not parse LLM JSON: {last_error}")

    @staticmethod
    def _regex_fallback_parse(text: str) -> dict | None:
        result = {}
        q = re.search(
            r'"question"\s*:\s*"((?:[^"\\]|\\.)*)"',
            text,
            re.DOTALL | re.IGNORECASE,
        )
        if q:
            result["question"] = q.group(1).encode().decode("unicode_escape")

        a = re.search(
            r'"(?:answer|option|text)"\s*:\s*"((?:[^"\\]|\\.)*)"',
            text,
            re.DOTALL | re.IGNORECASE,
        )
        if a:
            result["answer"] = a.group(1).encode().decode("unicode_escape")

        return result if result else None

    @staticmethod
    def _clean_text(value: str) -> str:
        value = (value or "").strip()
        for pattern in _PLACEHOLDER_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValueError(f"LLM returned placeholder text: {value[:80]}")
        return value

    @staticmethod
    def _field_value(data: dict, field: str) -> str:
        if field == "question":
            return (data.get("question") or "").strip()
        if field == "answer":
            return (
                data.get("answer") or data.get("option") or data.get("text") or ""
            ).strip()
        return (data.get(field) or "").strip()

    @staticmethod
    def _call_and_parse(prompt: str, system: str, required_fields: list[str]) -> dict:
        last_err = None
        extra = ""
        for _ in range(QuizAIConfig.LLM_MAX_RETRIES):
            try:
                raw = QuizLLM._call_ollama(prompt, system + extra)
                data = QuizLLM._parse_json(raw)
                for field in required_fields:
                    if not QuizLLM._field_value(data, field):
                        raise ValueError(f"Missing field: {field}")
                return data
            except (ValueError, json.JSONDecodeError, requests.RequestException) as exc:
                last_err = exc
                extra = " Output strict valid JSON only. Escape quotes inside strings."
        raise ValueError(f"LLM failed after {QuizAIConfig.LLM_MAX_RETRIES} tries: {last_err}")

    @staticmethod
    def generate_correct(
        context: str,
        subject_name: str,
        difficulty: str,
        question_number: int,
        total_questions: int,
    ) -> dict:
        context = (context or "")[:2000]
        system = (
            "You are a quiz generator. Output ONLY one JSON object. "
            "Use valid JSON with double-quoted strings. No markdown."
        )
        prompt = f"""Create ONE multiple-choice question for subject "{subject_name}" at {difficulty} difficulty.
Question number {question_number} of {total_questions}.

Use ONLY facts from this study material:
{context}

Output exactly:
{{"question":"your question here","answer":"the one correct option here"}}"""

        data = QuizLLM._call_and_parse(prompt, system, ["question", "answer"])
        question = QuizLLM._clean_text(
            (data.get("question") or "").strip()
        )
        answer = QuizLLM._clean_text(
            (data.get("answer") or data.get("option") or data.get("text") or "").strip()
        )
        return {"question": question, "answer": answer}

    @staticmethod
    def generate_wrong(
        context: str,
        subject_name: str,
        difficulty: str,
        question_number: int,
        wrong_index: int,
        question_text: str = "",
    ) -> dict:
        context = (context or "")[:2000]
        system = (
            "You are a quiz generator. Output ONLY one JSON object. "
            "Use valid JSON with double-quoted strings. No markdown."
        )
        q_hint = f"\nThe question is: {question_text}" if question_text else ""
        prompt = f"""Create ONE wrong (incorrect) answer option for subject "{subject_name}" at {difficulty} difficulty.
Distractor number {wrong_index} for question {question_number}.{q_hint}

Use ONLY facts from this study material:
{context}

The option must be plausible but clearly WRONG. Do not copy instruction text.

Output exactly:
{{"answer":"your wrong option here"}}"""

        data = QuizLLM._call_and_parse(prompt, system, ["answer"])
        answer = QuizLLM._clean_text(
            (data.get("answer") or data.get("option") or data.get("text") or "").strip()
        )
        return {"answer": answer}
