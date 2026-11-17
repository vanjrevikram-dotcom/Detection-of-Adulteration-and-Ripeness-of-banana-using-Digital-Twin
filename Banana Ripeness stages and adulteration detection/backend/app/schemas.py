from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=20)
    password: str = Field(min_length=6, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    phone: Optional[str] = Field(default=None, min_length=7, max_length=20)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Twins ----------
class TwinCreate(BaseModel):
    name: str = Field(default="My Banana", max_length=120)


class TwinUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)


class TwinOut(BaseModel):
    id: int
    twin_id: str
    name: str
    current_stage: Optional[str] = None
    ripeness_percentage: Optional[float] = None
    adulteration_status: Optional[str] = None
    adulteration_probability: Optional[float] = None
    confidence: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ---------- Generic ----------
class ObservationOut(BaseModel):
    id: int
    twin_id: str
    rgb_file_path: Optional[str] = None
    thermal_file_path: Optional[str] = None
    matrix_file_path: Optional[str] = None
    observation_time: Optional[datetime] = None
    predicted_stage: Optional[str] = None
    ripeness_percentage: Optional[float] = None
    adulteration_status: Optional[str] = None
    adulteration_probability: Optional[float] = None
    confidence: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PredictionOut(BaseModel):
    id: int
    twin_id: Optional[str] = None
    prediction_type: str
    prediction_value: str
    probability: Optional[float] = None
    confidence: Optional[float] = None
    details_json: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ForecastOut(BaseModel):
    id: int
    twin_id: str
    current_stage: str
    future_stage: str
    probability: Optional[float] = None
    estimated_time: Optional[str] = None
    method: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
