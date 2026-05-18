import os

from app.agents.base_agent import BaseAgent
from app.ai.config import AIConfig


class DocumentAgent(BaseAgent):
    def can_handle(self, file_path: str, mime_type: str = None) -> bool:
        ext = os.path.splitext(file_path)[1].lower()
        return ext in AIConfig.ALLOWED_DOC_EXT

    def extract_text(self, file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".pdf":
            return self._read_pdf(file_path)
        if ext in (".docx", ".doc"):
            return self._read_docx(file_path)
        if ext in (".txt", ".md", ".csv", ".json", ".xml", ".html"):
            return self._read_plain(file_path)

        return self._read_plain(file_path)

    @staticmethod
    def _read_pdf(path: str) -> str:
        from pypdf import PdfReader

        reader = PdfReader(path)
        pages = []
        for page in reader.pages:
            text = page.extract_text() or ""
            if text.strip():
                pages.append(text)
        return "\n".join(pages)

    @staticmethod
    def _read_docx(path: str) -> str:
        from docx import Document

        doc = Document(path)
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

    @staticmethod
    def _read_plain(path: str) -> str:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
