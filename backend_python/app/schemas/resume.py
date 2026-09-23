from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

class CandidateProfileSchema(BaseModel):
    id: Optional[int] = None
    candidate_name: Optional[str] = Field(default=None, alias="candidateName", serialization_alias="candidateName")
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    years_of_experience: Optional[float] = Field(default=0.0, alias="yearsOfExperience", serialization_alias="yearsOfExperience")
    highest_degree: Optional[str] = Field(default=None, alias="highestDegree", serialization_alias="highestDegree")
    summary: Optional[str] = None

    skills_json: Optional[str] = Field(default="[]", alias="skillsJson", serialization_alias="skillsJson")
    experience_json: Optional[str] = Field(default="[]", alias="experienceJson", serialization_alias="experienceJson")
    education_json: Optional[str] = Field(default="[]", alias="educationJson", serialization_alias="educationJson")
    projects_json: Optional[str] = Field(default="[]", alias="projectsJson", serialization_alias="projectsJson")
    preferred_roles_json: Optional[str] = Field(default="[]", alias="preferredRolesJson", serialization_alias="preferredRolesJson")
    locations_json: Optional[str] = Field(default="[]", alias="locationsJson", serialization_alias="locationsJson")
    remote_preference_json: Optional[str] = Field(default="[]", alias="remotePreferenceJson", serialization_alias="remotePreferenceJson")

    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt", serialization_alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True

class ProfileResponse(BaseModel):
    hasResume: bool = Field(alias="hasResume", serialization_alias="hasResume")
    resumeFilename: Optional[str] = Field(default=None, alias="resumeFilename", serialization_alias="resumeFilename")
    profile: Optional[CandidateProfileSchema] = None

    class Config:
        populate_by_name = True
