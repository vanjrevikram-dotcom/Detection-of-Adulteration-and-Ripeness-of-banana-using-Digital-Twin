# How to Run Banana Twin

## Requirements

- Windows with PowerShell
- Python 3.11
- Node.js 18 or newer
- The three model checkpoints in `custom_models/weights/`

The checkpoints are included in the project and should remain at these paths:

- `custom_models/weights/best_ripeness_model.pth`
- `custom_models/weights/best_banana_multimodal.pth`
- `custom_models/weights/lstm_forecaster.pth`

## Start the backend

Open PowerShell in the project root and run:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create `backend/.env` with the model paths and a local development secret:

```powershell
$secret = [guid]::NewGuid().ToString('N')
@"
SECRET_KEY=$secret
RIPENESS_MODEL_PATH=../custom_models/weights/best_ripeness_model.pth
ADULTERATION_MODEL_PATH=../custom_models/weights/best_banana_multimodal.pth
LSTM_MODEL_PATH=../custom_models/weights/lstm_forecaster.pth
"@ | Set-Content -Encoding ascii .env
```

Start the API from the `backend` directory:

```powershell
python -m uvicorn app.main:app --reload
```

The API is at `http://127.0.0.1:8000`. Check `http://127.0.0.1:8000/api/health`
or open the interactive API docs at `http://127.0.0.1:8000/docs`.

## Start the frontend

Keep the backend running. Open a second PowerShell window in the project root:

```powershell
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173/` in your browser. Register an account or log in to
use the analysis and Digital Twin pages. The Vite development server proxies API
requests to the local backend.

## Notes

- `backend/.env` and the local SQLite database are intentionally ignored by Git.
- The app uses the trained weights under `custom_models/weights/`; do not move
  or rename them without updating the corresponding model path variables.
- The 3D banana asset is served from `frontend/public/banana.glb`.
