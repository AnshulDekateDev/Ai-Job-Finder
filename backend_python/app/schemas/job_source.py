from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class JobSourceConfigSchema(BaseModel):
    id: Optional[int] = None
    name: str
    code: str
    base_url: Optional[str] = Field(default=None, alias="baseUrl", serialization_alias="baseUrl")
    search_url_pattern: Optional[str] = Field(default=None, alias="searchUrlPattern", serialization_alias="searchUrlPattern")
    access_method: Optional[str] = Field(default="DIRECT_PUBLIC_FEED", alias="accessMethod", serialization_alias="accessMethod")
    scraper_provider_ref: Optional[str] = Field(default=None, alias="scraperProviderRef", serialization_alias="scraperProviderRef")
    is_enabled: bool = Field(default=True, alias="isEnabled", serialization_alias="isEnabled")
    is_custom: bool = Field(default=False, alias="isCustom", serialization_alias="isCustom")
    search_param_mapping_json: Optional[str] = Field(default=None, alias="searchParamMappingJson", serialization_alias="searchParamMappingJson")
    status: Optional[str] = Field(default="READY")
    status_message: Optional[str] = Field(default=None, alias="statusMessage", serialization_alias="statusMessage")
    last_tested_at: Optional[datetime] = Field(default=None, alias="lastTestedAt", serialization_alias="lastTestedAt")
    updated_at: Optional[datetime] = Field(default=None, alias="updatedAt", serialization_alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True
