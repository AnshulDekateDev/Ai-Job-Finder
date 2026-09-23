from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)

    candidate_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    years_of_experience = Column(Float, default=0.0)
    highest_degree = Column(String, nullable=True)

    # JSON stored fields
    skills_json = Column(Text, default="[]")
    experience_json = Column(Text, default="[]")
    education_json = Column(Text, default="[]")
    projects_json = Column(Text, default="[]")
    preferred_roles_json = Column(Text, default="[]")
    locations_json = Column(Text, default="[]")
    remote_preference_json = Column(Text, default="[]")
    summary = Column(Text, nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="candidate_profile")
    resume = relationship("Resume", back_populates="candidate_profile")
