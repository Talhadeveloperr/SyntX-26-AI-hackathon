# backend/app/services/flashcards_service.py
import math
from datetime import date, timedelta
from app.database.connection import get_sql_connection


class FlashcardsService:

    # ── Decks ──────────────────────────────────────────────

    @staticmethod
    def get_decks(student_id):
        conn = get_sql_connection()
        cursor = conn.cursor()
        today = date.today().isoformat()
        cursor.execute("""
            SELECT d.deck_id, d.name, d.icon, d.created_at,
                   COUNT(c.card_id) AS total_cards,
                   SUM(CASE WHEN c.next_review <= ? THEN 1 ELSE 0 END) AS due_count
            FROM flashcard_decks d
            LEFT JOIN flashcards c ON c.deck_id = d.deck_id
            WHERE d.student_id = ?
            GROUP BY d.deck_id, d.name, d.icon, d.created_at
            ORDER BY d.created_at DESC
        """, (today, student_id))
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "deck_id":     row.deck_id,
                "name":        row.name,
                "icon":        row.icon,
                "total_cards": row.total_cards or 0,
                "due_count":   row.due_count   or 0,
            }
            for row in rows
        ]

    @staticmethod
    def create_deck(student_id, data):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO flashcard_decks (student_id, name, icon)
            VALUES (?, ?, ?)
        """, (student_id, data.get("name"), data.get("icon", "style")))
        conn.commit()
        cursor.execute("SELECT @@IDENTITY AS id")
        new_id = int(cursor.fetchone().id)
        conn.close()
        return {"deck_id": new_id, "message": "Deck created"}

    @staticmethod
    def delete_deck(student_id, deck_id):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM flashcard_decks WHERE deck_id = ? AND student_id = ?",
            (deck_id, student_id)
        )
        conn.commit()
        conn.close()
        return {"message": "Deck deleted"}

    # ── Cards ──────────────────────────────────────────────

    @staticmethod
    def get_cards(student_id, deck_id):
        conn = get_sql_connection()
        cursor = conn.cursor()
        # Verify ownership
        cursor.execute(
            "SELECT deck_id FROM flashcard_decks WHERE deck_id = ? AND student_id = ?",
            (deck_id, student_id)
        )
        if not cursor.fetchone():
            conn.close()
            raise PermissionError("Deck not found")
        cursor.execute("""
            SELECT card_id, deck_id, front_text, back_text,
                   interval_days, ease_factor, next_review, review_count
            FROM flashcards
            WHERE deck_id = ? AND student_id = ?
            ORDER BY next_review ASC, card_id ASC
        """, (deck_id, student_id))
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "card_id":      row.card_id,
                "deck_id":      row.deck_id,
                "front_text":   row.front_text,
                "back_text":    row.back_text,
                "interval_days": row.interval_days,
                "ease_factor":  round(row.ease_factor, 2),
                "next_review":  row.next_review.strftime("%Y-%m-%d") if row.next_review else None,
                "review_count": row.review_count,
            }
            for row in rows
        ]

    @staticmethod
    def add_card(student_id, deck_id, data):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT deck_id FROM flashcard_decks WHERE deck_id = ? AND student_id = ?",
            (deck_id, student_id)
        )
        if not cursor.fetchone():
            conn.close()
            raise PermissionError("Deck not found")
        cursor.execute("""
            INSERT INTO flashcards (deck_id, student_id, front_text, back_text)
            VALUES (?, ?, ?, ?)
        """, (deck_id, student_id, data.get("front_text"), data.get("back_text")))
        conn.commit()
        cursor.execute("SELECT @@IDENTITY AS id")
        new_id = int(cursor.fetchone().id)
        conn.close()
        return {"card_id": new_id, "message": "Card added"}

    @staticmethod
    def delete_card(student_id, card_id):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM flashcards WHERE card_id = ? AND student_id = ?",
            (card_id, student_id)
        )
        conn.commit()
        conn.close()
        return {"message": "Card deleted"}

    # ── Review (SM-2 spaced repetition) ───────────────────

    @staticmethod
    def review_card(student_id, card_id, rating):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT interval_days, ease_factor
            FROM flashcards
            WHERE card_id = ? AND student_id = ?
        """, (card_id, student_id))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise ValueError("Card not found")

        interval = row.interval_days
        ef       = row.ease_factor

        if rating == "Hard":
            new_interval = 1
            new_ef = max(1.3, ef - 0.2)
        elif rating == "Medium":
            new_interval = max(1, math.ceil(interval * 1.2))
            new_ef = ef
        else:  # Easy
            new_interval = max(1, math.ceil(interval * ef))
            new_ef = min(3.5, ef + 0.15)

        next_review = (date.today() + timedelta(days=new_interval)).isoformat()

        cursor.execute("""
            UPDATE flashcards
            SET interval_days = ?,
                ease_factor   = ?,
                next_review   = ?,
                last_reviewed = GETDATE(),
                review_count  = review_count + 1
            WHERE card_id = ? AND student_id = ?
        """, (new_interval, round(new_ef, 4), next_review, card_id, student_id))
        conn.commit()
        conn.close()
        return {"next_review": next_review, "interval_days": new_interval}

    # ── Stats ──────────────────────────────────────────────

    @staticmethod
    def get_stats(student_id):
        conn = get_sql_connection()
        cursor = conn.cursor()
        today = date.today()
        today_str = today.isoformat()

        cursor.execute("""
            SELECT
                COUNT(*)  AS total_cards,
                SUM(CASE WHEN next_review <= ? THEN 1 ELSE 0 END) AS total_due,
                SUM(CASE WHEN CAST(last_reviewed AS DATE) = ? THEN 1 ELSE 0 END) AS reviewed_today
            FROM flashcards
            WHERE student_id = ?
        """, (today_str, today_str, student_id))
        row = cursor.fetchone()
        total_cards    = row.total_cards    or 0
        total_due      = row.total_due      or 0
        reviewed_today = row.reviewed_today or 0

        # Streak: distinct days with at least one review, consecutive back from today
        cursor.execute("""
            SELECT DISTINCT CAST(last_reviewed AS DATE) AS review_date
            FROM flashcards
            WHERE student_id = ? AND last_reviewed IS NOT NULL
            ORDER BY review_date DESC
        """, (student_id,))
        dates = [r.review_date for r in cursor.fetchall()]
        conn.close()

        streak = 0
        for i, d in enumerate(dates):
            if d == today - timedelta(days=i):
                streak += 1
            else:
                break

        return {
            "total_cards":    total_cards,
            "total_due":      total_due,
            "reviewed_today": reviewed_today,
            "streak":         streak,
        }
