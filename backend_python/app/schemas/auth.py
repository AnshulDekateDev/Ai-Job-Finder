from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    email: str
    password: str
    fullName: Optional[str] = Field(default="Job Seeker", alias="fullName")

    class Config:
        populate_by_name = True

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    userId: int = Field(alias="userId")
    email: str
    fullName: str = Field(alias="fullName")

    class Config:
        populate_by_name = True
        from_attributes = True

class AuthResponse(BaseModel):
    token: str
    userId: int = Field(alias="userId")
    email: str
    fullName: str = Field(alias="fullName")

    class Config:
        populate_by_name = True
