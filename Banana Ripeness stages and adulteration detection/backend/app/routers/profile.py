from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..utils.security import hash_password, verify_password
from .auth import normalize_phone

router = APIRouter(prefix="/api/auth", tags=["profile"])


@router.put("/profile", response_model=schemas.UserOut)
def update_profile(payload: schemas.ProfileUpdate,
                   user: models.User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user.id).first()
    if payload.name:
        db_user.name = payload.name.strip()
    if payload.phone:
        db_user.phone = normalize_phone(payload.phone)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.put("/password")
def change_password(payload: schemas.PasswordChange,
                    user: models.User = Depends(get_current_user),
                    db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user.id).first()
    if not verify_password(payload.current_password, db_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Current password is incorrect.")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400,
                            detail="New password must differ from the current one.")
    db_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"updated": True}


@router.get("/stats")
def my_stats(user: models.User = Depends(get_current_user),
             db: Session = Depends(get_db)):
    twins = db.query(models.BananaTwin).filter(
        models.BananaTwin.owner_user_id == user.id).all()
    twin_ids = [t.twin_id for t in twins]
    n_obs = db.query(models.Observation).filter(
        models.Observation.twin_id.in_(twin_ids)).count() if twin_ids else 0
    n_pred = db.query(models.Prediction).filter(
        models.Prediction.owner_user_id == user.id).count()
    return {"twins": len(twins), "observations": n_obs,
            "analyses": n_pred + n_obs, "predictions": n_pred,
            "name": user.name, "email": user.email, "phone": user.phone,
            "created_at": user.created_at}
