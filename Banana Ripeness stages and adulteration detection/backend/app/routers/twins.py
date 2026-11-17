from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..services import xai_service as xai
from ..services.forecast_service import build_forecast
from ..services.twin_service import next_twin_id
from ..utils.file_utils import save_image, save_matrix

router = APIRouter(prefix="/api/twins", tags=["twins"])


def _require_twin(db: Session, user_id: int, twin_id: str) -> models.BananaTwin:
    twin = db.query(models.BananaTwin).filter(
        models.BananaTwin.twin_id == twin_id,
        models.BananaTwin.owner_user_id == user_id).first()
    if twin is None:
        raise HTTPException(status_code=404, detail="Twin not found.")
    return twin


@router.post("", response_model=schemas.TwinOut)
def create_twin(payload: schemas.TwinCreate,
                user: models.User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    twin = models.BananaTwin(twin_id=next_twin_id(db),
                             owner_user_id=user.id,
                             name=payload.name.strip() or "My Banana")
    db.add(twin)
    db.commit()
    db.refresh(twin)
    return twin


@router.get("", response_model=list[schemas.TwinOut])
def list_twins(user: models.User = Depends(get_current_user),
               db: Session = Depends(get_db)):
    return db.query(models.BananaTwin).filter(
        models.BananaTwin.owner_user_id == user.id).order_by(
        models.BananaTwin.created_at.desc()).all()


@router.get("/{twin_id}", response_model=schemas.TwinOut)
def get_twin(twin_id: str, user: models.User = Depends(get_current_user),
             db: Session = Depends(get_db)):
    return _require_twin(db, user.id, twin_id)


@router.put("/{twin_id}", response_model=schemas.TwinOut)
def update_twin(twin_id: str, payload: schemas.TwinUpdate,
                user: models.User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    twin = _require_twin(db, user.id, twin_id)
    if payload.name:
        twin.name = payload.name.strip()
    twin.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(twin)
    return twin


@router.delete("/{twin_id}")
def delete_twin(twin_id: str, user: models.User = Depends(get_current_user),
                db: Session = Depends(get_db)):
    twin = _require_twin(db, user.id, twin_id)
    db.delete(twin)
    db.commit()
    return {"deleted": twin_id}


@router.get("/{twin_id}/history", response_model=list[schemas.ObservationOut])
def twin_history(twin_id: str, user: models.User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    _require_twin(db, user.id, twin_id)
    return db.query(models.Observation).filter(
        models.Observation.twin_id == twin_id).order_by(
        models.Observation.observation_time).all()


@router.get("/{twin_id}/predictions", response_model=list[schemas.PredictionOut])
def twin_predictions(twin_id: str,
                     user: models.User = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    _require_twin(db, user.id, twin_id)
    return db.query(models.Prediction).filter(
        models.Prediction.twin_id == twin_id,
        models.Prediction.owner_user_id == user.id).order_by(
        models.Prediction.created_at.desc()).all()


@router.get("/{twin_id}/forecast")
def get_forecast(twin_id: str, user: models.User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    twin = _require_twin(db, user.id, twin_id)
    obs = db.query(models.Observation).filter(
        models.Observation.twin_id == twin_id).order_by(
        models.Observation.observation_time).all()
    current = twin.current_stage or (obs[-1].predicted_stage if obs else None)
    if not current:
        raise HTTPException(status_code=422,
                            detail="No observations yet — run an analysis first.")
    result = build_forecast(current, obs)
    fc = models.Forecast(twin_id=twin_id, current_stage=result["current_stage"],
                         future_stage=result["future_stage"],
                         probability=result["probability"],
                         estimated_time=result["estimated_time"],
                         method=result["method"])
    db.add(fc)
    db.commit()
    db.refresh(fc)
    return {"forecast": result, "history_length": len(obs), "id": fc.id,
            "disclaimer": "Future-stage forecast from observation-history "
                          "heuristics, not an independently trained temporal model."}


@router.post("/{twin_id}/forecast")
def post_forecast(twin_id: str, user: models.User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    return get_forecast(twin_id, user, db)


@router.post("/{twin_id}/explain")
async def explain_twin(twin_id: str,
                       rgb: UploadFile | None = None,
                       thermal: UploadFile | None = None,
                       matrix: UploadFile | None = None,
                       user: models.User = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    twin = _require_twin(db, user.id, twin_id)
    obs = db.query(models.Observation).filter(
        models.Observation.twin_id == twin_id).order_by(
        models.Observation.id.desc()).first()
    rgb_p = str(await save_image(rgb, "rgb")) if rgb else (
        obs.rgb_file_path if obs else None)
    th_p = str(await save_image(thermal, "thermal")) if thermal else (
        obs.thermal_file_path if obs else None)
    mx_p = str(await save_matrix(matrix)) if matrix else (
        obs.matrix_file_path if obs else None)
    out: dict = {"twin_id": twin.twin_id}
    try:
        if rgb_p:
            out["adulteration"] = xai.explain_adulteration(
                rgb_p, th_p, mx_p
            )
        if rgb_p and th_p and mx_p:
            out["ripeness"] = xai.explain_ripeness(rgb_p, th_p, mx_p)
        if len(out) == 1:
            raise HTTPException(status_code=422,
                                detail="No source files available for explanation.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"XAI error: {exc}")
    return out
