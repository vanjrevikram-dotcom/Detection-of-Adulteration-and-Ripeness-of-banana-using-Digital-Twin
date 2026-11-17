import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent  # backend/
PROJECT_ROOT = BASE_DIR.parent  # project root

load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'app.db'}")

STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
EXPLAIN_DIR = STORAGE_DIR / "explanations"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
EXPLAIN_DIR.mkdir(parents=True, exist_ok=True)

def _find_model_path(env_var: str, candidates: list[Path]) -> Path:
    val = os.getenv(env_var)
    if val and Path(val).exists():
        return Path(val)
    for c in candidates:
        if c.exists():
            return c
    return candidates[0]

RIPENESS_MODEL_PATH = _find_model_path(
    "RIPENESS_MODEL_PATH",
    [
        PROJECT_ROOT / "custom_models" / "weights" / "best_ripeness_model.pth",
        PROJECT_ROOT / "models" / "best_ripeness_model.pth",
        PROJECT_ROOT / "models" / "best_multimodal_model.pth",
    ]
)

ADULTERATION_MODEL_PATH = _find_model_path(
    "ADULTERATION_MODEL_PATH",
    [
        PROJECT_ROOT / "custom_models" / "weights" / "best_banana_multimodal.pth",
        PROJECT_ROOT / "models" / "best_banana_multimodal.pth",
        PROJECT_ROOT / "models" / "best_adulteration_model.pth",
    ]
)

_lstm_model_path = os.getenv("LSTM_MODEL_PATH")
if not _lstm_model_path:
    raise RuntimeError("LSTM_MODEL_PATH must be set in backend/.env")
LSTM_MODEL_PATH = Path(_lstm_model_path)
if not LSTM_MODEL_PATH.is_absolute():
    LSTM_MODEL_PATH = (BASE_DIR / LSTM_MODEL_PATH).resolve()

RIPENESS_STAGES = [
    "Stage_1_Mature_Green",
    "Stage_2_Green_Yellow_Transition",
    "Stage_3_Early_Ripening",
    "Stage_4_Fully_Yellow",
    "Stage_5_Yellow_Spotted",
]
# Representative ripeness percentage per stage.
STAGE_RIPENESS_CENTERS = [12.0, 32.0, 55.0, 80.0, 96.0]

# Adulteration class mapping from training: 0=Natural, 1=Adulterated
ADULTERATION_CLASSES = ["Natural", "Adulterated"]

MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "25"))
ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png"}
ALLOWED_MATRIX_EXTS = {".xlsx", ".xls", ".csv"}

# Real-SHAP settings for the thermal-matrix explanation.
SHAP_BG_DIR = STORAGE_DIR / "shap_background"
SHAP_BG_DIR.mkdir(parents=True, exist_ok=True)
SHAP_BACKGROUND_K = int(os.getenv("SHAP_BACKGROUND_K", "8"))  # 4-16 recommended
SHAP_NSAMPLES = int(os.getenv("SHAP_NSAMPLES", "25"))
SHAP_BG_MAX = int(os.getenv("SHAP_BG_MAX", "16"))

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
