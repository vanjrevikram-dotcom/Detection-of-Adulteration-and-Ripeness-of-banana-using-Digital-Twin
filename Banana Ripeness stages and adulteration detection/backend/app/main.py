import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import (ADULTERATION_MODEL_PATH, EXPLAIN_DIR, FRONTEND_ORIGIN,
                     LSTM_MODEL_PATH, RIPENESS_MODEL_PATH, STORAGE_DIR)
from .database import Base, SessionLocal, engine
from .models import ModelVersion  # noqa: F401  (register tables)
from .routers import auth, explain, models, prediction, profile, twins

app = FastAPI(title="Banana Digital Twin API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:5173",
                   "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Lightweight migration for DBs created before the phone field existed.
from sqlalchemy import text as _text
with engine.begin() as _conn:
    _cols = [r[1] for r in
             _conn.execute(_text("PRAGMA table_info(users)")).fetchall()]
    if "phone" not in _cols:
        _conn.execute(_text("ALTER TABLE users ADD COLUMN phone VARCHAR(20)"))
app.mount("/files", StaticFiles(directory=str(STORAGE_DIR)), name="files")

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(models.router)
app.include_router(prediction.router)
app.include_router(twins.router)
app.include_router(explain.router)


@app.on_event("startup")
def verify_models():
    missing = [str(p) for p in (RIPENESS_MODEL_PATH, ADULTERATION_MODEL_PATH, LSTM_MODEL_PATH)
               if not os.path.exists(p)]
    if missing:
        raise RuntimeError(
            "Model file(s) missing: " + ", ".join(missing) +
            ". Place the trained .pth files in custom_models/weights/ or models/.")
    # Lazy-load with caching; warm load here to fail fast with clear error.
    from .ml.adulteration_model import get_adulteration_model
    from .ml.ripeness_model import get_ripeness_model
    from .ml.lstm_forecaster import get_lstm_model
    get_ripeness_model(str(RIPENESS_MODEL_PATH))
    get_adulteration_model(str(ADULTERATION_MODEL_PATH))
    get_lstm_model(str(LSTM_MODEL_PATH))
    db = SessionLocal()
    try:
        for name, path in (("ripeness_multimodal", RIPENESS_MODEL_PATH),
                           ("adulteration", ADULTERATION_MODEL_PATH),
                           ("lstm_forecaster", LSTM_MODEL_PATH)):
            if not db.query(ModelVersion).filter(
                    ModelVersion.model_name == name).first():
                db.add(ModelVersion(
                    model_name=name, model_path=str(path), version="v1",
                    metrics_json={"note": "experimental evaluation results; "
                                          "see landing page"}))
        db.commit()
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok",
            "ripeness_model": os.path.exists(RIPENESS_MODEL_PATH),
            "adulteration_model": os.path.exists(ADULTERATION_MODEL_PATH),
            "lstm_model": os.path.exists(LSTM_MODEL_PATH),
            "explanations_dir": os.path.exists(EXPLAIN_DIR)}
