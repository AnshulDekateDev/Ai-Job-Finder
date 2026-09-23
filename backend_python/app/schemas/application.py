from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.jobs import JobItem

class ApplicationRecordRequest(BaseModel):
    status: Optional[str] = "APPLICATION_STARTED"
    notes: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    job: JobItem
    status: str
    originalApplicationUrl: Optional[str] = Field(default=None, alias="originalApplicationUrl")
    notes: Optional[str] = None
    appliedAt: Optional[datetime] = Field(default=None, alias="appliedAt")
    updatedAt: Optional[datetime] = Field(default=None, alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True

class SavedJobResponse(BaseModel):
    id: int
    job: JobItem
    notes: Optional[str] = None
    savedAt: datetime = Field(alias="savedAt")

    class Config:
        populate_by_name = True
        from_attributes = True
