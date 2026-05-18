#backend\app\services\auth_services.py
from app.extensions import  bcrypt
from app.database.connection import get_sql_connection
import secrets
from datetime import datetime, timedelta

from flask import request, jsonify
class AuthService:

    @staticmethod
    def register_student(data):

        conn = get_sql_connection()
        cursor = conn.cursor()

        email = data.get("email")

        # Check existing email
        cursor.execute(
            "SELECT * FROM students WHERE email = ?",
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            return {"error": "Email already exists"}

        hashed_password = bcrypt.generate_password_hash(
                data["password"]
            ).decode("utf-8")

        cursor.execute("""
            INSERT INTO students
            (
                full_name,
                email,
                password_hash,
                class_level,
                institution_name,
                city,
                age
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("full_name"),
            data.get("email"),
            hashed_password,
            data.get("class_level"),
            data.get("institution_name"),
            data.get("city"),
            data.get("age")
        ))

        conn.commit()

        return {
            "message": "Student registered successfully"
        }

    # =========================
    # UPDATE PROFILE
    # =========================
    @staticmethod
    def update_profile(student_id, data):
        conn = get_sql_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE students
            SET full_name = ?,
                class_level = ?,
                institution_name = ?,
                city = ?,
                age = ?
            WHERE student_id = ?
        """, (
            data.get("full_name") or "",
            data.get("class_level") or "",
            data.get("institution_name") or "",
            data.get("city") or "",
            data.get("age") or 0,
            student_id,
        ))

        conn.commit()
        return {"message": "Profile updated successfully"}

    # =========================
    # LOGIN
    # =========================
    @staticmethod
    def login_student(data):

        conn = get_sql_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM students
            WHERE email = ?
        """, (data.get("email"),))

        student = cursor.fetchone()

        if not student:
            return {"error": "Invalid email"}

        if not bcrypt.check_password_hash(
            student.password_hash,
            data.get("password")
        ):
            return {"error": "Invalid password"}

        return {
            "student_id": student.student_id,
            "full_name": student.full_name,
            "email": student.email,
            "class_level": student.class_level,
            "institution_name": student.institution_name,
            "city": student.city,
            "age": student.age,
            "role": student.role
        }