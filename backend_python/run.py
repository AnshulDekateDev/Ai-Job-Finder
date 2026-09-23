import uvicorn
from app.config import settings

if __name__ == "__main__":
    print(f"🚀 Starting AI Job Finder FastAPI Backend on http://localhost:{settings.PORT}")
    print(f"📖 Interactive API Docs (Swagger): http://localhost:{settings.PORT}/docs")
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
