import requests

from app.ai.config import AIConfig


class OllamaLLM:
    @staticmethod
    def generate(
        prompt: str,
        system: str = None,
        model: str = None,
        temperature: float = 0.4,
    ) -> str:
        model = model or AIConfig.OLLAMA_MODEL
        url = f"{AIConfig.OLLAMA_BASE_URL}/api/generate"
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature},
        }
        if system:
            payload["system"] = system

        try:
            response = requests.post(url, json=payload, timeout=120)
            response.raise_for_status()
            data = response.json()
            return (data.get("response") or "").strip()
        except requests.RequestException as exc:
            return (
                f"I could not reach the local Ollama server ({AIConfig.OLLAMA_BASE_URL}). "
                f"Ensure Ollama is running and model '{model}' is pulled. Error: {exc}"
            )

    @staticmethod
    def build_rag_prompt(
        user_question: str,
        context_chunks: list[dict],
        history: list[dict],
    ) -> tuple[str, str]:
        context_block = ""
        if context_chunks:
            lines = []
            for i, ch in enumerate(context_chunks, 1):
                source = ch.get("file_name", "upload")
                lines.append(f"[{i}] ({source})\n{ch.get('text', '')}")
            context_block = "\n\n".join(lines)

        system = (
            "You are Study AI, a helpful academic assistant. "
            "Answer using the provided document context when relevant. "
            "If the context does not contain the answer, say so clearly and use general knowledge cautiously. "
            "Be concise and accurate."
        )

        history_lines = []
        for msg in history[-AIConfig.MAX_HISTORY_MESSAGES :]:
            role = msg.get("role", "user").capitalize()
            history_lines.append(f"{role}: {msg.get('content', '')}")

        parts = []
        if context_block:
            parts.append("=== DOCUMENT CONTEXT ===\n" + context_block)
        if history_lines:
            parts.append("=== CHAT HISTORY ===\n" + "\n".join(history_lines))
        parts.append("=== USER QUESTION ===\n" + user_question)
        parts.append("=== ASSISTANT ===")

        return system, "\n\n".join(parts)
