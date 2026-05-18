import os
class Config:
    SECRET_KEY = "super-secret-key"
    # JWT
    JWT_SECRET_KEY = "THIS_IS_A_VERY_LONG_SECURE_SECRET_KEY_123456"

    JWT_TOKEN_LOCATION = ["headers", "cookies"]
    JWT_COOKIE_SECURE = False  # ok for localhost
    JWT_COOKIE_SAMESITE = "Lax"

    JWT_ACCESS_COOKIE_NAME = "access_token"
    JWT_REFRESH_COOKIE_NAME = "refresh_token"

    JWT_COOKIE_CSRF_PROTECT = False