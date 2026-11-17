import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(prefix="/api/models", tags=["models"])

_DATA_PATH = Path(__file__).resolve().parent.parent / "performance_data.json"


@router.get("/performance")
def model_performance():
    """Verified experimental evaluation metrics + training curves.

    Numbers come from the training notebooks' held-out test evaluation
    (see performance_data.json). Not live accuracy guarantees.
    """
    with open(_DATA_PATH) as f:
        return json.load(f)
