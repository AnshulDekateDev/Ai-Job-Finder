import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("uvicorn.error")

Base = declarative_base()

def get_engine():
    # Attempt primary database (Supabase PostgreSQL)
    if settings.DATABASE_URL and "postgres" in settings.DATABASE_URL:
        try:
            logger.info("Attempting connection to Supabase PostgreSQL...")
            pg_engine = create_engine(
                settings.DATABASE_URL,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
                connect_args={"connect_timeout": 5}
            )
            # Test connection
            with pg_engine.connect() as conn:
                logger.info("Successfully connected to Supabase PostgreSQL database.")
            return pg_engine
        except Exception as e:
            logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to local SQLite: {settings.SQLITE_FALLBACK_URL}")

    # Fallback to SQLite
    return create_engine(
        settings.SQLITE_FALLBACK_URL,
        connect_args={"check_same_thread": False}
    )

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
