#backend\app\routes\auth_routes.py
from flask import Blueprint, request, jsonify, Response, stream_with_context
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    set_refresh_cookies,
    set_access_cookies
)
from datetime import timedelta
from app.services.auth_services import AuthService

auth_bp = Blueprint("auth", __name__)

# =========================
# REGISTER
# =========================
@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    result = AuthService.register_student(data)

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result), 201


# =========================
# LOGIN
# =========================
@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    result = AuthService.login_student(data)

    if "error" in result:
        return jsonify(result), 401

    # JWT Identity
    identity = {
        "student_id": result["student_id"],
        "email": result["email"],
        "role": result["role"]
    }

    access_token = create_access_token(
        identity=identity,
        expires_delta=timedelta(days=1)
    )

    refresh_token = create_refresh_token(identity=identity)

    return jsonify({
        "token": access_token,
        "refresh_token": refresh_token,

        "student": {
            "student_id": result["student_id"],
            "full_name": result["full_name"],
            "email": result["email"],
            "class_level": result["class_level"],
            "institution_name": result["institution_name"],
            "city": result["city"],
            "age": result["age"],
            "role": result["role"]
        }
    }), 200
# =========================
@auth_bp.route("/profile", methods=["PUT"])
def update_profile():
    data = request.get_json()

    # TEMP: get student_id from request body (NOT secure)
    student_id = data.get("student_id")

    result = AuthService.update_profile(student_id, data)

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    new_access_token = create_access_token(
        identity=identity,
        expires_delta=timedelta(minutes=15)  # ✅ Keep same expiry
    )
    return jsonify({
        "access_token": new_access_token  # ✅ Make sure key matches frontend
    }), 200
@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"message": "Logged out"})
    response.delete_cookie("refresh_token")
    return response, 200