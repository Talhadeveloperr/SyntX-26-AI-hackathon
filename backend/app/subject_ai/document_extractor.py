import os

from app.subject_ai.config import SubjectAIConfig


class SubjectDocumentExtractor:

    @staticmethod
    def extract(file_path: str, mime_type: str = None) -> str:
        ext = os.path.splitext(file_path)[1].lower()

        if ext in SubjectAIConfig.ALLOWED_IMAGE_EXT or (
            mime_type and mime_type.startswith("image/")
        ):
            return SubjectDocumentExtractor._extract_image(file_path)

        if ext == ".pdf":
            return SubjectDocumentExtractor._read_pdf(file_path)
        if ext in (".docx", ".doc"):
            return SubjectDocumentExtractor._read_docx(file_path)
        if ext in SubjectAIConfig.ALLOWED_DOC_EXT | {".json", ".xml", ".html"}:
            return SubjectDocumentExtractor._read_plain(file_path)

        try:
            return SubjectDocumentExtractor._read_plain(file_path)
        except OSError:
            return f"[Binary file: {os.path.basename(file_path)}]"

    @staticmethod
    def _extract_image(path: str) -> str:
        try:
            from PIL import Image
            import pytesseract

            image = Image.open(path)
            text = (pytesseract.image_to_string(image) or "").strip()
            if text:
                return f"[Image OCR: {os.path.basename(path)}]\n{text}"
            return f"[Image: {os.path.basename(path)} — no OCR text detected]"
        except Exception as exc:
            return f"[Image: {os.path.basename(path)} — OCR unavailable: {exc}]"

    @staticmethod
    def _read_pdf(path: str) -> str:
        from pypdf import PdfReader

        reader = PdfReader(path)
        return "\n".join(
            (page.extract_text() or "")
            for page in reader.pages
            if (page.extract_text() or "").strip()
        )

    @staticmethod
    def _read_docx(path: str) -> str:
        from docx import Document

        doc = Document(path)
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

    @staticmethod
    def _read_plain(path: str) -> str:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
