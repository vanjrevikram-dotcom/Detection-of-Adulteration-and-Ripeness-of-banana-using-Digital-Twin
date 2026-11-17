from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text

from .database import Base


def _now():
    return datetime.utcnow()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=_now)


class BananaTwin(Base):
    __tablename__ = "banana_twins"
    id = Column(Integer, primary_key=True, index=True)
    twin_id = Column(String(16), unique=True, index=True, nullable=False)  # BT-000001
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False, default="My Banana")
    current_stage = Column(String(64), nullable=True)
    ripeness_percentage = Column(Float, nullable=True)
    adulteration_status = Column(String(32), nullable=True)
    adulteration_probability = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)


class Observation(Base):
    __tablename__ = "observations"
    id = Column(Integer, primary_key=True, index=True)
    twin_id = Column(String(16), index=True, nullable=False)
    rgb_file_path = Column(String(512), nullable=True)
    thermal_file_path = Column(String(512), nullable=True)
    matrix_file_path = Column(String(512), nullable=True)
    observation_time = Column(DateTime, default=_now)
    predicted_stage = Column(String(64), nullable=True)
    ripeness_percentage = Column(Float, nullable=True)
    adulteration_status = Column(String(32), nullable=True)
    adulteration_probability = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=_now)


class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    twin_id = Column(String(16), index=True, nullable=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    prediction_type = Column(String(32), nullable=False)  # ripeness|adulteration|combined
    prediction_value = Column(String(128), nullable=False)
    probability = Column(Float, nullable=True)
    confidence = Column(Float, nullable=True)
    details_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=_now)


class Forecast(Base):
    __tablename__ = "forecasts"
    id = Column(Integer, primary_key=True, index=True)
    twin_id = Column(String(16), index=True, nullable=False)
    current_stage = Column(String(64), nullable=False)
    future_stage = Column(String(64), nullable=False)
    probability = Column(Float, nullable=True)
    estimated_time = Column(String(128), nullable=True)
    method = Column(String(64), nullable=False, default="heuristic-trend")
    created_at = Column(DateTime, default=_now)


class ModelVersion(Base):
    __tablename__ = "model_versions"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(64), nullable=False)
    model_path = Column(String(512), nullable=False)
    version = Column(String(32), nullable=False, default="v1")
    metrics_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=_now)
