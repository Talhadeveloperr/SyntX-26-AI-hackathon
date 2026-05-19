# backend/app/pastpaper_ai/document_extractor.py
import os
from app.pastpaper_ai.config import PastpaperAIConfig


class PastpaperDocumentExtractor:

    @staticmethod
    def extract(file_path: str, mime_type: str = None) -> str:
        ext = os.path.splitext(file_path)[1].lower()

        if ext in PastpaperAIConfig.ALLOWED_IMAGE_EXT or (
            mime_type and mime_type.startswith("image/")
        ):
            return PastpaperDocumentExtractor._extract_image(file_path)

        if ext == ".pdf":
            return PastpaperDocumentExtractor._read_pdf(file_path)
        if ext in (".docx", ".doc"):
            return PastpaperDocumentExtractor._read_docx(file_path)
        if ext in PastpaperAIConfig.ALLOWED_DOC_EXT or ext in (".json", ".xml", ".html"):
            return PastpaperDocumentExtractor._read_plain(file_path)

        try:
            return PastpaperDocumentExtractor._read_plain(file_path)
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
        try:
            from pypdf import PdfReader
            reader = PdfReader(path)
            return "\n".join(
                (page.extract_text() or "")
                for page in reader.pages
                if (page.extract_text() or "").strip()
            )
        except Exception as exc:
            return f"[PDF reader exception: {exc}]"

    @staticmethod
    def _read_docx(path: str) -> str:
        try:
            from docx import Document
            doc = Document(path)
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except Exception as exc:
            return f"[DOCX reader exception: {exc}]"

    @staticmethod
    def _read_plain(path: str) -> str:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
