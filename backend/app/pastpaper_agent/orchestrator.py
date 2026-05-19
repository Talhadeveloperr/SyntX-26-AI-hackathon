# backend/app/pastpaper_agent/orchestrator.py
from app.pastpaper_agent.analysis_agent import PastpaperAnalysisAgent
from app.pastpaper_ai.document_extractor import PastpaperDocumentExtractor


class PastpaperOrchestrator:
    """
    Orchestrates the entire past paper analysis pipeline:
    1. Extracts text from file path
    2. Invokes PastpaperAnalysisAgent to predict exam questions
    3. Formats results cleanly
    """

    def __init__(self):
        self._analysis_agent = PastpaperAnalysisAgent()

    def analyze_paper_file(self, file_path: str, subject_name: str) -> list[dict]:
        # Step 1: Extract text content from document (supports PDF, Docx, images, txt)
        extracted_text = PastpaperDocumentExtractor.extract(file_path)

        if not extracted_text or extracted_text.startswith("[Image: ") and "OCR unavailable" in extracted_text:
            # If extraction yields nothing useful or fails, return empty or fallback
            return [
                {
                    "question_text": f"Discuss the major themes and issues raised in the study material for {subject_name}.",
                    "total_marks": 10,
                    "confidence": 70.0,
                    "topic": "General Review"
                }
            ]

        # Step 2: Use the analysis agent to generate questions
        predictions = self._analysis_agent.run(
            content=extracted_text,
            subject_name=subject_name
        )

        return predictions

    def analyze_paper_files(self, file_paths: list[str], subject_name: str) -> list[dict]:
        import os
        combined_texts = []
        for path in file_paths:
            basename = os.path.basename(path)
            extracted_text = PastpaperDocumentExtractor.extract(path)
            if extracted_text and not (extracted_text.startswith("[Image: ") and "OCR unavailable" in extracted_text):
                combined_texts.append(f"--- Document: {basename} ---\n{extracted_text}\n")
        
        combined_context = "\n".join(combined_texts)

        if not combined_context.strip():
            return [
                {
                    "question_text": f"Discuss the core methodologies and practical applications within the subject {subject_name}.",
                    "total_marks": 10,
                    "confidence": 80.0,
                    "topic": "General Review"
                }
            ]

        predictions = self._analysis_agent.run(
            content=combined_context,
            subject_name=subject_name
        )

        return predictions
