from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class JobSearchQuery(BaseModel):
    titles: Optional[List[str]] = Field(default_factory=list)
    locations: Optional[List[str]] = Field(default_factory=list)
    countries: Optional[List[str]] = Field(default_factory=list)
    workModes: Optional[List[str]] = Field(default_factory=list, alias="workModes")
    experienceRange: Optional[str] = Field(default="0-2 years", alias="experienceRange")
    minMatchPercentage: Optional[float] = Field(default=60.0, alias="minMatchPercentage")
    maxResults: Optional[int] = Field(default=30, alias="maxResults")
    candidateSkills: Optional[List[str]] = Field(default_factory=list, alias="candidateSkills")

    class Config:
        populate_by_name = True

class JobItem(BaseModel):
    id: Optional[int] = None
    external_id: Optional[str] = Field(default=None, serialization_alias="externalId")
    source_code: Optional[str] = Field(default=None, serialization_alias="sourceCode")
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    country: Optional[str] = None
    remote_type: Optional[str] = Field(default="REMOTE", serialization_alias="remoteType")
    salary: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    skills_json: Optional[str] = Field(default="[]", serialization_alias="skillsJson")
    min_experience_required: Optional[float] = Field(default=0.0, serialization_alias="minExperienceRequired")
    max_experience_required: Optional[float] = Field(default=5.0, serialization_alias="maxExperienceRequired")
    application_url: Optional[str] = Field(default=None, serialization_alias="applicationUrl")
    job_url: Optional[str] = Field(default=None, serialization_alias="jobUrl")
    posted_at: Optional[datetime] = Field(default=None, serialization_alias="postedAt")

    class Config:
        populate_by_name = True
        from_attributes = True

class JobMatchItem(BaseModel):
    id: Optional[int] = None
    match_percentage: float = Field(default=0.0, serialization_alias="matchPercentage")
    skills_score: float = Field(default=0.0, serialization_alias="skillsScore")
    experience_score: float = Field(default=0.0, serialization_alias="experienceScore")
    title_score: float = Field(default=0.0, serialization_alias="titleScore")
    location_score: float = Field(default=0.0, serialization_alias="locationScore")
    education_score: float = Field(default=0.0, serialization_alias="educationScore")
    projects_score: float = Field(default=0.0, serialization_alias="projectsScore")
    matched_skills_json: Optional[str] = Field(default="[]", serialization_alias="matchedSkillsJson")
    missing_skills_json: Optional[str] = Field(default="[]", serialization_alias="missingSkillsJson")
    match_summary: Optional[str] = Field(default=None, serialization_alias="matchSummary")
    experience_summary: Optional[str] = Field(default=None, serialization_alias="experienceSummary")
    location_summary: Optional[str] = Field(default=None, serialization_alias="locationSummary")

    class Config:
        populate_by_name = True
        from_attributes = True

class JobMatchResult(BaseModel):
    job: JobItem
    jobMatch: JobMatchItem = Field(alias="jobMatch", serialization_alias="jobMatch")
    isSaved: bool = Field(default=False, alias="isSaved", serialization_alias="isSaved")
    applicationStatus: str = Field(default="DISCOVERED", alias="applicationStatus", serialization_alias="applicationStatus")

    class Config:
        populate_by_name = True

class SourceProgressItem(BaseModel):
    sourceName: str = Field(alias="sourceName", serialization_alias="sourceName")
    message: str
    jobsFound: int = Field(default=0, alias="jobsFound", serialization_alias="jobsFound")
    status: str

    class Config:
        populate_by_name = True

class SearchResultResponse(BaseModel):
    jobs: List[JobMatchResult]
    totalRawFound: int = Field(alias="totalRawFound", serialization_alias="totalRawFound")
    deduplicatedCount: int = Field(alias="deduplicatedCount", serialization_alias="deduplicatedCount")
    matchedCount: int = Field(alias="matchedCount", serialization_alias="matchedCount")
    progressLog: List[SourceProgressItem] = Field(default_factory=list, alias="progressLog", serialization_alias="progressLog")

    class Config:
        populate_by_name = True
