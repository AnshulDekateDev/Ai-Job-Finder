from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class JobSourceConfig(Base):
    __tablename__ = "job_source_configs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    name = Column(String, nullable=False)
    code = Column(String, nullable=False)  # REMOTEOK, GREENHOUSE, LEVER, WE_WORK_REMOTELY, GOOGLE_JOBS, INDEED, LINKEDIN, WELLFOUND, CUSTOM
    base_url = Column(String, nullable=True)
    search_url_pattern = Column(String, nullable=True)
    access_method = Column(String, default="DIRECT_PUBLIC_FEED")
    scraper_provider_ref = Column(String, nullable=True)

    is_enabled = Column(Boolean, default=True)
    is_custom = Column(Boolean, default=False)
    search_param_mapping_json = Column(Text, nullable=True)

    status = Column(String, default="READY")  # READY, NEEDS_CONFIG, UNAVAILABLE, BLOCKED
    status_message = Column(String, nullable=True)
    last_tested_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="job_sources")
