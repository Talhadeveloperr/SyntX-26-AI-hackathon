import os

from app.agents.base_agent import BaseAgent
from app.ai.config import AIConfig


class ImageAgent(BaseAgent):
    def can_handle(self, file_path: str, mime_type: str = None) -> bool:
        ext = os.path.splitext(file_path)[1].lower()
        if ext in AIConfig.ALLOWED_IMAGE_EXT:
            return True
        if mime_type and mime_type.startswith("image/"):
            return True
        return False

    def extract_text(self, file_path: str) -> str:
        try:
            from PIL import Image
            import pytesseract

            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            text = (text or "").strip()
            if text:
                return f"[Image OCR: {os.path.basename(file_path)}]\n{text}"
            return (
                f"[Image uploaded: {os.path.basename(file_path)}. "
                "No readable text was detected via OCR. "
                "Describe what you need from this image in your message.]"
            )
        except Exception as exc:
            return (
                f"[Image: {os.path.basename(file_path)}. "
                f"OCR unavailable ({exc}). Ask the user to describe the image content.]"
            )
