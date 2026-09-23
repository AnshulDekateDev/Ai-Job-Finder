from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class AiProviderRequest(BaseModel):
    providerType: str = Field(alias="providerType")
    apiKey: Optional[str] = Field(default=None, alias="apiKey")
    modelName: Optional[str] = Field(default=None, alias="modelName")
    baseUrl: Optional[str] = Field(default=None, alias="baseUrl")
    isDefault: Optional[bool] = Field(default=True, alias="isDefault")

    class Config:
        populate_by_name = True

class AiProviderResponse(BaseModel):
    id: int
    providerType: str = Field(alias="providerType")
    modelName: Optional[str] = Field(default=None, alias="modelName")
    baseUrl: Optional[str] = Field(default=None, alias="baseUrl")
    isDefault: bool = Field(alias="isDefault")
    isActive: bool = Field(alias="isActive")
    status: str
    lastStatusMessage: Optional[str] = Field(default=None, alias="lastStatusMessage")
    lastTestedAt: Optional[datetime] = Field(default=None, alias="lastTestedAt")
    maskedApiKey: Optional[str] = Field(default=None, alias="maskedApiKey")

    class Config:
        populate_by_name = True
        from_attributes = True

class ScraperProviderRequest(BaseModel):
    providerType: str = Field(alias="providerType")
    apiKey: Optional[str] = Field(default=None, alias="apiKey")
    baseUrl: Optional[str] = Field(default=None, alias="baseUrl")
    isDefault: Optional[bool] = Field(default=True, alias="isDefault")

    class Config:
        populate_by_name = True

class ScraperProviderResponse(BaseModel):
    id: int
    providerType: str = Field(alias="providerType")
    baseUrl: Optional[str] = Field(default=None, alias="baseUrl")
    isDefault: bool = Field(alias="isDefault")
    isActive: bool = Field(alias="isActive")
    status: str
    lastStatusMessage: Optional[str] = Field(default=None, alias="lastStatusMessage")
    lastTestedAt: Optional[datetime] = Field(default=None, alias="lastTestedAt")
    maskedApiKey: Optional[str] = Field(default=None, alias="maskedApiKey")

    class Config:
        populate_by_name = True
        from_attributes = True
