from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class SearchPreference(Base):
    __tablename__ = "search_preferences"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    target_titles_json = Column(Text, default='["Java Developer", "Backend Developer", "Python Developer"]')
    target_locations_json = Column(Text, default='["India", "Remote India", "Remote Worldwide"]')
    countries_json = Column(Text, default='["India", "United States", "United Kingdom", "Germany", "Canada", "Australia"]')
    work_modes_json = Column(Text, default='["REMOTE", "HYBRID", "ON_SITE"]')
    experience_range = Column(String, default="0-2 years")
    min_match_percentage = Column(Float, default=60.0)
    max_results = Column(Integer, default=30)
    selected_sources_json = Column(Text, default='["REMOTEOK", "GREENHOUSE", "LEVER", "WE_WORK_REMOTELY", "GOOGLE_JOBS"]')

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="search_preference")
