# app/__init__.py

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from app.config import Config
from app.extensions import bcrypt, jwt


def create_app():

    app = Flask(__name__)

    app.config.from_object(Config)

    jwt.init_app(app)
    bcrypt.init_app(app)

    # =========================
    # CORS CONFIG
    # =========================
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://136.243.35.104:3000",
                    "http://localhost:3000",
                    "http://127.0.0.1:3000"
                ]
            }
        },
        supports_credentials=True,
        allow_headers=[
            "Content-Type",
            "Authorization"
        ],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # =========================
    # ROUTES
    # =========================
    from app.routes.auth_routes import auth_bp
    from app.routes.studyplanner_routes import studyplanner_bp
    from app.routes.flashcards_routes import flashcards_bp
    from app.routes.chat_routes import chat_bp
    from app.routes.subject_routes import subject_bp
    from app.routes.quiz_routes import quiz_bp



    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(studyplanner_bp, url_prefix="/api/studyplanner")
    app.register_blueprint(flashcards_bp, url_prefix="/api/flashcards")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(subject_bp, url_prefix="/api/subjects")
    app.register_blueprint(quiz_bp, url_prefix="/api/quiz")



    return app