from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        Index("idx_external_id_source", "external_id", "source_code", unique=True),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    external_id = Column(String, nullable=False)
    source_code = Column(String, nullable=False)
    title = Column(String, nullable=False)
    company = Column(String, nullable=True)
    location = Column(String, nullable=True)
    country = Column(String, nullable=True)
    remote_type = Column(String, nullable=True)  # REMOTE, HYBRID, ON_SITE
    salary = Column(String, nullable=True)

    description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    skills_json = Column(Text, default="[]")
    min_experience_required = Column(Float, default=0.0)
    max_experience_required = Column(Float, default=5.0)

    application_url = Column(String(2048), nullable=True)
    job_url = Column(String(2048), nullable=True)
    posted_at = Column(DateTime, nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    matches = relationship("JobMatch", back_populates="job", cascade="all, delete-orphan")
    saved_entries = relationship("SavedJob", back_populates="job", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    cover_letters = relationship("CoverLetter", back_populates="job", cascade="all, delete-orphan")


class JobMatch(Base):
    __tablename__ = "job_matches"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)

    match_percentage = Column(Float, default=0.0)
    skills_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    title_score = Column(Float, default=0.0)
    location_score = Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)
    projects_score = Column(Float, default=0.0)

    matched_skills_json = Column(Text, default="[]")
    missing_skills_json = Column(Text, default="[]")
    match_summary = Column(Text, nullable=True)
    experience_summary = Column(Text, nullable=True)
    location_summary = Column(Text, nullable=True)

    computed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="job_matches")
    job = relationship("Job", back_populates="matches")


class SavedJob(Base):
    __tablename__ = "saved_jobs"
    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_saved_jobs_user_job"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)

    notes = Column(Text, nullable=True)
    saved_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="saved_jobs")
    job = relationship("Job", back_populates="saved_entries")
