# backend/app/flashcard_ai/llm.py
import json
import re
import requests

from app.flashcard_ai.config import FlashcardAIConfig

_PLACEHOLDER_PATTERNS = [
    r"^the question text$",
    r"^the answer text$",
    r"^flashcard question",
    r"^return json",
]


class FlashcardLLM:
    """Single LLM call per flashcard — returns {question, answer}."""

    # ------------------------------------------------------------------ #
    #  Low-level Ollama call                                               #
    # ------------------------------------------------------------------ #
    @staticmethod
    def _call_ollama(prompt: str, system: str) -> str:
        url = f"{FlashcardAIConfig.OLLAMA_BASE_URL}/api/generate"
        payload = {
            "model": FlashcardAIConfig.OLLAMA_MODEL,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "format": "json",
            "options": {"temperature": FlashcardAIConfig.TEMPERATURE},
        }
        response = requests.post(
            url, json=payload, timeout=FlashcardAIConfig.REQUEST_TIMEOUT
        )
        response.raise_for_status()
        return (response.json().get("response") or "").strip()

    # ------------------------------------------------------------------ #
    #  JSON parsing helpers (same approach as QuizLLM)                    #
    # ------------------------------------------------------------------ #
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
            candidates.append(FlashcardLLM._extract_braced_object(text))
        except ValueError:
            pass

        last_error = None
        for candidate in candidates:
            for attempt in (candidate, FlashcardLLM._repair_json_string(candidate)):
                try:
                    data = json.loads(attempt)
                    if isinstance(data, str):
                        data = json.loads(data)
                    if isinstance(data, dict):
                        return data
                except json.JSONDecodeError as exc:
                    last_error = exc

        parsed = FlashcardLLM._regex_fallback_parse(text)
        if parsed:
            return parsed

        raise ValueError(f"Could not parse LLM JSON: {last_error}")

    @staticmethod
    def _regex_fallback_parse(text: str) -> dict | None:
        result = {}
        q = re.search(
            r'"(?:question|q)"\s*:\s*"((?:[^"\\]|\\.)*)"',
            text,
            re.DOTALL | re.IGNORECASE,
        )
        if q:
            result["question"] = q.group(1)

        a = re.search(
            r'"(?:answer|a|explanation)"\s*:\s*"((?:[^"\\]|\\.)*)"',
            text,
            re.DOTALL | re.IGNORECASE,
        )
        if a:
            result["answer"] = a.group(1)

        return result if result else None

    @staticmethod
    def _clean_text(value: str) -> str:
        value = (value or "").strip()
        for pattern in _PLACEHOLDER_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValueError(f"LLM returned placeholder text: {value[:80]}")
        return value

    @staticmethod
    def _call_and_parse(prompt: str, system: str, required_fields: list[str]) -> dict:
        last_err = None
        extra = ""
        for _ in range(FlashcardAIConfig.LLM_MAX_RETRIES):
            try:
                raw = FlashcardLLM._call_ollama(prompt, system + extra)
                data = FlashcardLLM._parse_json(raw)
                for field in required_fields:
                    val = (
                        data.get(field)
                        or data.get("q" if field == "question" else "a")
                        or ""
                    )
                    if not val.strip():
                        raise ValueError(f"Missing field: {field}")
                return data
            except (ValueError, json.JSONDecodeError, requests.RequestException) as exc:
                last_err = exc
                extra = " Output strict valid JSON only. Escape quotes inside strings."
        raise ValueError(
            f"FlashcardLLM failed after {FlashcardAIConfig.LLM_MAX_RETRIES} tries: {last_err}"
        )

    # ------------------------------------------------------------------ #
    #  Public generation methods                                           #
    # ------------------------------------------------------------------ #
    @staticmethod
    def generate_flashcard(
        context: str,
        subject_name: str,
        card_number: int,
        total_cards: int,
    ) -> dict:
        """
        Returns {"question": "...", "answer": "..."} from a single LLM call.
        """
        context = (context or "")[:2000]
        system = (
            "You are a flashcard generator for students. "
            "Output ONLY one JSON object with two fields: "
            '"question" (a concise study question) and '
            '"answer" (a clear, factual answer). '
            "Use valid JSON with double-quoted strings. No markdown."
        )
        prompt = f"""Create ONE flashcard for subject "{subject_name}".
Flashcard {card_number} of {total_cards}.

Use ONLY facts from this study material:
{context}

The question must be concise and test understanding.
The answer must be clear, factual, and complete in 1–3 sentences.

Output exactly:
{{"question":"your question here","answer":"your answer here"}}"""

        data = FlashcardLLM._call_and_parse(prompt, system, ["question", "answer"])

        question = FlashcardLLM._clean_text(
            (data.get("question") or data.get("q") or "").strip()
        )
        answer = FlashcardLLM._clean_text(
            (data.get("answer") or data.get("a") or data.get("explanation") or "").strip()
        )
        return {"question": question, "answer": answer}
