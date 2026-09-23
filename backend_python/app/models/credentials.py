from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class AiProviderCredential(Base):
    __tablename__ = "ai_provider_credentials"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    provider_type = Column(String, nullable=False)  # GEMINI, OPENAI, ANTHROPIC, MOCK_DEMO
    encrypted_api_key = Column(String(1024), nullable=False)
    model_name = Column(String, nullable=True)
    base_url = Column(String, nullable=True)

    is_default = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    status = Column(String, default="UNTESTED")  # READY, INVALID_KEY, UNTESTED, ERROR
    last_status_message = Column(String, nullable=True)
    last_tested_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="ai_credentials")


class ScraperCredential(Base):
    __tablename__ = "scraper_credentials"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    provider_type = Column(String, nullable=False)  # SCRAPER_API, BRIGHT_DATA, APIFY, DIRECT_FEED, SCRAPE_DO
    encrypted_api_key = Column(String(1024), nullable=True)
    base_url = Column(String, nullable=True)

    is_default = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    status = Column(String, default="UNTESTED")  # READY, INVALID_KEY, UNTESTED, ERROR
    last_status_message = Column(String, nullable=True)
    last_tested_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="scraper_credentials")
