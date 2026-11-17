# Banana Digital Twin — Ripeness & Adulteration Intelligence

Local full-stack app: a **FastAPI + SQLite + JWT** backend and a **React +
TypeScript + Tailwind** frontend.

## Models

The application loads its trained checkpoints from `custom_models/weights/`,
configured by `RIPENESS_MODEL_PATH`, `ADULTERATION_MODEL_PATH`, and
`LSTM_MODEL_PATH` in `backend/.env`.

- **Ripeness — `BananaNet`:** `custom_models/weights/best_ripeness_model.pth`.
  Uses RGB, thermal, and thermal-matrix inputs to classify one of five stages.
- **Adulteration — `BananaMultimodalNet`:**
  `custom_models/weights/best_banana_multimodal.pth`. Uses RGB, thermal, and
  thermal-matrix inputs to classify Natural or Adulterated. Its output is an
  AI-estimated likelihood, not chemical concentration or laboratory
  certification.
- **Forecasting — `LSTMForecaster`:**
  `custom_models/weights/lstm_forecaster.pth`. Uses the digital twin's
  observation history to estimate a future ripeness stage and time.

## Project structure

- `backend/` — FastAPI application, configuration, routes, services, and local
  SQLite database.
- `frontend/` — React application. The banana model is served from
  `frontend/public/banana.glb`.
- `custom_models/architectures/model_code.py` — shared definitions for
  `BananaNet`, `BananaMultimodalNet`, their branches, and `LSTMForecaster`.
- `custom_models/weights/` — the three checkpoints used by the app.
- `custom_models/training_notebooks/` — model training notebooks; these are
  not needed for normal app startup.

## 1. Prerequisites

- Python 3.10+
- Node.js 18+ / npm
- The three model checkpoints in `custom_models/weights/`

## 2. Backend setup

```powershell
cd backend
pip install -r requirements.txt
# backend/.env contains the model checkpoint paths; set a secure SECRET_KEY for production
uvicorn app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.
Health: `GET http://127.0.0.1:8000/api/health` → `{"status":"ok",...}`.

## Explainability (XAI)

- Ripeness RGB / Thermal → Grad-CAM heatmaps (hand-rolled hooks on each
  EfficientNet-B0 branch), saved under `backend/storage/explanations/`.
- Thermal Matrix → REAL SHAP. SHAP GradientExplainer is used to estimate the
  contribution of thermal-matrix features to the selected ripeness prediction
  (`shap.GradientExplainer` over a wrapper that holds RGB/Thermal fixed and
  varies only the 64×48 matrix; small background pool, `POST
  /api/explain/ripeness/matrix-shap`). No retraining, no architecture changes.
- Adulteration RGB → Grad-CAM.
- SHAP outputs are model-attribution estimates for the uploaded sample only —
  not chemical detection, laboratory measurement, certified food safety, or
  exact physical temperature attribution beyond what the matrix represents.


## 3. Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

“Digital Twin is a persistent virtual representation of an individual banana
used to store its current condition, observations, historical progression,
adulteration assessment, and future-stage forecast.”