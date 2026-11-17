from datetime import datetime

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..services import inference_service as infer
from ..services import xai_service as xai
from ..services.forecast_service import build_forecast
from ..services.twin_service import get_or_auto_create_twin
from ..utils.file_utils import public_url, save_image, save_matrix

router = APIRouter(prefix="/api/predict", tags=["predict"])


def _record(db, user, twin, ptype, value, prob, conf, details):
    pred = models.Prediction(
        twin_id=twin.twin_id if twin else None,
        owner_user_id=user.id, prediction_type=ptype,
        prediction_value=value, probability=prob, confidence=conf,
        details_json=details)
    db.add(pred)
    db.commit()
    db.refresh(pred)
    return pred


def _observe(db, twin, rgb=None, thermal=None, matrix=None,
             stage=None, ripe=None, a_status=None, a_prob=None, conf=None):
    if twin is None:
        return None
    obs = models.Observation(
        twin_id=twin.twin_id,
        rgb_file_path=str(rgb) if rgb else None,
        thermal_file_path=str(thermal) if thermal else None,
        matrix_file_path=str(matrix) if matrix else None,
        observation_time=datetime.utcnow(),
        predicted_stage=stage, ripeness_percentage=ripe,
        adulteration_status=a_status, adulteration_probability=a_prob,
        confidence=conf)
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return obs
    return obs


def _touch_twin(db, twin, stage=None, ripe=None, a_status=None,
                a_prob=None, conf=None):
    if twin is None:
        return
    if stage: twin.current_stage = stage
    if ripe is not None: twin.ripeness_percentage = ripe
    if a_status: twin.adulteration_status = a_status
    if a_prob is not None: twin.adulteration_probability = a_prob
    if conf is not None: twin.confidence = conf
    twin.updated_at = datetime.utcnow()
    db.commit()


@router.post("/ripeness")
async def predict_ripeness(
    rgb: UploadFile, thermal: UploadFile, matrix: UploadFile,
    twin_id: str | None = Form(default=None),
    twin_name: str | None = Form(default=None),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    rgb_p = await save_image(rgb, "rgb")
    th_p = await save_image(thermal, "thermal")
    mx_p = await save_matrix(matrix)
    try:
        result = infer.predict_ripeness(str(rgb_p), str(th_p), str(mx_p))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    twin, twin_created = get_or_auto_create_twin(db, user, twin_id, twin_name)
    pred = _record(db, user, twin, "ripeness", result["predicted_stage"],
                   result["confidence"], result["confidence"],
                   {**result, "rgb": public_url(rgb_p),
                    "thermal": public_url(th_p)})
    _observe(db, twin, rgb_p, th_p, mx_p, result["predicted_stage"],
             result["ripeness_percentage"], conf=result["confidence"])
    _touch_twin(db, twin, result["predicted_stage"],
                result["ripeness_percentage"], conf=result["confidence"])
    return {"prediction_id": pred.id, **result,
            "rgb_url": public_url(rgb_p), "thermal_url": public_url(th_p),
            "twin_id": twin.twin_id, "twin_name": twin.name,
            "twin_created": twin_created}


@router.post("/adulteration")
async def predict_adulteration(
    rgb: UploadFile,
    twin_id: str | None = Form(default=None),
    twin_name: str | None = Form(default=None),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    rgb_p = await save_image(rgb, "rgb")
    try:
        result = infer.predict_adulteration(str(rgb_p))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    twin, twin_created = get_or_auto_create_twin(db, user, twin_id, twin_name)
    pred = _record(db, user, twin, "adulteration", result["status"],
                   result["confidence"], result["confidence"],
                   {**result, "rgb": public_url(rgb_p)})
    _observe(db, twin, rgb_p, a_status=result["status"],
             a_prob=result["adulterated_probability"],
             conf=result["confidence"])
    _touch_twin(db, twin, a_status=result["status"],
                a_prob=result["adulterated_probability"],
                conf=result["confidence"])
    return {"prediction_id": pred.id, **result,
            "rgb_url": public_url(rgb_p),
            "twin_id": twin.twin_id, "twin_name": twin.name,
            "twin_created": twin_created}


@router.post("/combined")
async def predict_combined(
    rgb: UploadFile, thermal: UploadFile, matrix: UploadFile,
    twin_id: str | None = Form(default=None),
    twin_name: str | None = Form(default=None),
    explain: bool = Form(default=True),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    rgb_p = await save_image(rgb, "rgb")
    th_p = await save_image(thermal, "thermal")
    mx_p = await save_matrix(matrix)
    try:
        ripe = infer.predict_ripeness(str(rgb_p), str(th_p), str(mx_p))
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    try:
        adult = infer.predict_adulteration(str(rgb_p), str(th_p), str(mx_p))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    twin, twin_created = get_or_auto_create_twin(db, user, twin_id, twin_name)
    details = {"ripeness": ripe, "adulteration": adult,
               "rgb": public_url(rgb_p), "thermal": public_url(th_p)}
    explanations = None
    if explain:
        try:
            explanations = {
                **xai.explain_ripeness(str(rgb_p), str(th_p), str(mx_p)),
                **{"adulteration_" + k: v for k, v in
                   xai.explain_adulteration(
                       str(rgb_p), str(th_p), str(mx_p)
                   ).items()},
            }
            details["explanations"] = explanations
        except Exception as exc:  # XAI must never break analysis
            details["explanations_error"] = str(exc)
    pred = _record(db, user, twin, "combined",
                   f"{ripe['predicted_stage']} / {adult['status']}",
                   adult["confidence"], ripe["confidence"], details)
    current_observation = _observe(
        db, twin, rgb_p, th_p, mx_p, ripe["predicted_stage"],
        ripe["ripeness_percentage"], adult["status"],
        adult["adulterated_probability"], ripe["confidence"])
    _touch_twin(db, twin, ripe["predicted_stage"],
                ripe["ripeness_percentage"], adult["status"],
                adult["adulterated_probability"], ripe["confidence"])
    obs = db.query(models.Observation).filter(
        models.Observation.twin_id == twin.twin_id).order_by(
        models.Observation.observation_time, models.Observation.id).all()
    history = [
        o for o in obs
        if current_observation is None or o.id != current_observation.id
    ]
    import numpy as np
    current_vec = np.array(ripe["_probs"] + adult["_probs"], dtype=np.float32)
    forecast = build_forecast(
        ripe["predicted_stage"], history, current_vec=current_vec
    )
    return {"prediction_id": pred.id, "ripeness": ripe,
            "adulteration": adult, "explanations": explanations,
            "forecast": forecast,
            "rgb_url": public_url(rgb_p), "thermal_url": public_url(th_p),
            "twin_id": twin.twin_id, "twin_name": twin.name,
            "twin_created": twin_created}


@router.get("", response_model=list[schemas.PredictionOut])
def list_my_predictions(user: models.User = Depends(get_current_user),
                        db: Session = Depends(get_db)):
    """All predictions of the current user, newest first."""
    return db.query(models.Prediction).filter(
        models.Prediction.owner_user_id == user.id).order_by(
        models.Prediction.created_at.desc()).limit(200).all()


@router.get("/ripeness/{prediction_id}")
@router.get("/adulteration/{prediction_id}")
@router.get("/combined/{prediction_id}")
async def get_prediction(prediction_id: int,
                         db: Session = Depends(get_db),
                         user: models.User = Depends(get_current_user)):
    pred = db.query(models.Prediction).filter(
        models.Prediction.id == prediction_id,
        models.Prediction.owner_user_id == user.id).first()
    if pred is None:
        raise HTTPException(status_code=404, detail="Prediction not found.")
    return {"id": pred.id, "twin_id": pred.twin_id,
            "prediction_type": pred.prediction_type,
            "prediction_value": pred.prediction_value,
            "probability": pred.probability, "confidence": pred.confidence,
            "details": pred.details_json, "created_at": pred.created_at}
