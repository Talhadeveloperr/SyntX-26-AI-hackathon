# backend/app/services/studypalnner_service.py
from app.database.connection import get_sql_connection


class StudyPlannerService:

    # ─────────────────────────────────────────
    # DEADLINES
    # ─────────────────────────────────────────

    @staticmethod
    def get_deadlines(student_id):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT deadline_id, student_id, subject_name, description,
                   deadline_date, priority, status, created_at, updated_at
            FROM study_deadlines
            WHERE student_id = ?
            ORDER BY
                CASE status WHEN 'pending' THEN 0 ELSE 1 END,
                deadline_date ASC
        """, (student_id,))
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "deadline_id":  row.deadline_id,
                "student_id":   row.student_id,
                "subject_name": row.subject_name,
                "description":  row.description or "",
                "deadline_date": row.deadline_date.strftime("%Y-%m-%d") if row.deadline_date else None,
                "priority":     row.priority,
                "status":       row.status,
                "created_at":   row.created_at.strftime("%Y-%m-%d %H:%M:%S") if row.created_at else None,
            }
            for row in rows
        ]

    @staticmethod
    def add_deadline(student_id, data):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO study_deadlines
                (student_id, subject_name, description, deadline_date, priority)
            VALUES (?, ?, ?, ?, ?)
        """, (
            student_id,
            data.get("subject_name"),
            data.get("description", ""),
            data.get("deadline_date"),
            data.get("priority", "Medium"),
        ))
        conn.commit()
        cursor.execute("SELECT @@IDENTITY AS id")
        new_id = int(cursor.fetchone().id)
        conn.close()
        return {"deadline_id": new_id, "message": "Deadline added"}

    @staticmethod
    def update_deadline(student_id, deadline_id, data):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE study_deadlines
            SET subject_name  = ?,
                description   = ?,
                deadline_date = ?,
                priority      = ?,
                status        = ?,
                updated_at    = GETDATE()
            WHERE deadline_id = ? AND student_id = ?
        """, (
            data.get("subject_name"),
            data.get("description", ""),
            data.get("deadline_date"),
            data.get("priority", "Medium"),
            data.get("status", "pending"),
            deadline_id,
            student_id,
        ))
        conn.commit()
        conn.close()
        return {"message": "Deadline updated"}

    @staticmethod
    def delete_deadline(student_id, deadline_id):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM study_deadlines
            WHERE deadline_id = ? AND student_id = ?
        """, (deadline_id, student_id))
        conn.commit()
        conn.close()
        return {"message": "Deadline deleted"}

    # ─────────────────────────────────────────
    # SESSIONS
    # ─────────────────────────────────────────

    @staticmethod
    def get_sessions(student_id):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT session_id, student_id, subject_name, session_date,
                   duration_minutes, notes, created_at
            FROM study_sessions
            WHERE student_id = ?
            ORDER BY session_date DESC
        """, (student_id,))
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "session_id":       row.session_id,
                "student_id":       row.student_id,
                "subject_name":     row.subject_name,
                "session_date":     row.session_date.strftime("%Y-%m-%d") if row.session_date else None,
                "duration_minutes": row.duration_minutes,
                "notes":            row.notes or "",
                "created_at":       row.created_at.strftime("%Y-%m-%d %H:%M:%S") if row.created_at else None,
            }
            for row in rows
        ]

    @staticmethod
    def add_session(student_id, data):
        conn = get_sql_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO study_sessions
                (student_id, subject_name, session_date, duration_minutes, notes)
            VALUES (?, ?, ?, ?, ?)
        """, (
            student_id,
            data.get("subject_name"),
            data.get("session_date"),
            int(data.get("duration_minutes", 30)),
            data.get("notes", ""),
        ))
        conn.commit()
        cursor.execute("SELECT @@IDENTITY AS id")
        new_id = int(cursor.fetchone().id)
        conn.close()
        return {"session_id": new_id, "message": "Session logged"}

    # ─────────────────────────────────────────
    # STATS
    # ─────────────────────────────────────────

    @staticmethod
    def get_stats(student_id):
        conn = get_sql_connection()
        cursor = conn.cursor()

        # Focus minutes in the last 7 days
        cursor.execute("""
            SELECT COALESCE(SUM(duration_minutes), 0) AS total_minutes
            FROM study_sessions
            WHERE student_id = ?
              AND session_date >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
              AND session_date <= CAST(GETDATE() AS DATE)
        """, (student_id,))
        total_minutes = cursor.fetchone().total_minutes or 0

        # Pending deadlines (today and future)
        cursor.execute("""
            SELECT COUNT(*) AS cnt
            FROM study_deadlines
            WHERE student_id = ?
              AND status = 'pending'
              AND deadline_date >= CAST(GETDATE() AS DATE)
        """, (student_id,))
        upcoming = cursor.fetchone().cnt or 0

        # Completed deadlines
        cursor.execute("""
            SELECT COUNT(*) AS cnt
            FROM study_deadlines
            WHERE student_id = ? AND status = 'completed'
        """, (student_id,))
        completed = cursor.fetchone().cnt or 0

        conn.close()
        return {
            "focus_hours_week":    round(total_minutes / 60, 1),
            "upcoming_deadlines":  upcoming,
            "completed_deadlines": completed,
        }
