from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class SearchPreferenceSchema(BaseModel):
    id: Optional[int] = None
    targetTitlesJson: Optional[str] = Field(default='["Java Developer", "Backend Developer", "Python Developer"]', alias="targetTitlesJson")
    targetLocationsJson: Optional[str] = Field(default='["India", "Remote India", "Remote Worldwide"]', alias="targetLocationsJson")
    countriesJson: Optional[str] = Field(default='["India", "United States", "United Kingdom", "Germany", "Canada", "Australia"]', alias="countriesJson")
    workModesJson: Optional[str] = Field(default='["REMOTE", "HYBRID", "ON_SITE"]', alias="workModesJson")
    experienceRange: Optional[str] = Field(default="0-2 years", alias="experienceRange")
    minMatchPercentage: Optional[float] = Field(default=60.0, alias="minMatchPercentage")
    maxResults: Optional[int] = Field(default=30, alias="maxResults")
    selectedSourcesJson: Optional[str] = Field(default='["REMOTEOK", "GREENHOUSE", "LEVER", "WE_WORK_REMOTELY", "GOOGLE_JOBS"]', alias="selectedSourcesJson")
    updatedAt: Optional[datetime] = Field(default=None, alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True
