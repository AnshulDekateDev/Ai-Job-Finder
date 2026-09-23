import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Server
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    DEBUG: bool = True

    # Database: Supabase PostgreSQL with local fallback
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:anshulIND%40121@db.pkhvagsatjfgjjtqzicy.supabase.co:5432/postgres?sslmode=require"
    )
    SQLITE_FALLBACK_URL: str = "sqlite:///./jobfinder.db"

    # Security & Encryption
    MASTER_ENCRYPTION_KEY: str = os.getenv(
        "MASTER_ENCRYPTION_KEY",
        "AiJobFinderMasterSecretKey2026Secure256BitSalt!!"
    )
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET",
        "AiJobFinderJWTSecretSuperSecureKeyForTokenSigningAndAuthentication2026RequirementPass"
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_SECONDS: int = 86400  # 24 hours

    # CORS
    CORS_ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
