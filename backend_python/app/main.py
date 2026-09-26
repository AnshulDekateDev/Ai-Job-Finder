import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
import app.models  # Ensure all SQLAlchemy models are registered
from app.routers import (
    auth,
    resume,
    integrations,
    job_sources,
    jobs,
    applications,
    search_preferences,
)

logger = logging.getLogger("uvicorn.error")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Auto-create tables in connected database (Supabase or SQLite)
    logger.info("Initializing database schemas...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas verified and initialized successfully.")
        from app.db_migration import migrate_legacy_postgres_lobs, migrate_supabase_auth_columns
        migrate_supabase_auth_columns(engine)
        migrate_legacy_postgres_lobs(engine)
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
    yield
    # Shutdown
    logger.info("Shutting down AI Job Finder backend.")

app = FastAPI(
    title="AI Job Finder API",
    description="User-Configurable AI Job Search & Matching Engine with Native Python AI Providers",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routers
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(integrations.router)
app.include_router(job_sources.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(search_preferences.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "UP",
        "service": "AI Job Finder (FastAPI)",
        "engine": "Python 3.12 + FastAPI + Native AI"
    }

@app.get("/", tags=["Health"])
def root():
    return {
        "message": "AI Job Finder FastAPI Backend is Running",
        "docs": "/docs",
        "health": "/api/health"
    }
