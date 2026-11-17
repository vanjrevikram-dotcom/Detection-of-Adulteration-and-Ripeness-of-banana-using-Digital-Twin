from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..utils.security import (create_access_token, hash_password,
                              verify_password)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def normalize_phone(raw: str) -> str:
    cleaned = "".join(ch for ch in raw.strip() if ch.isdigit() or ch == "+")
    if cleaned.startswith("+"):
        digits = cleaned[1:]
        prefix = "+"
    else:
        digits = cleaned
        prefix = ""
    if not digits.isdigit() or not 7 <= len(digits) <= 15:
        raise HTTPException(status_code=422,
                            detail="Phone number must contain 7–15 digits.")
    return prefix + digits


@router.post("/register", response_model=schemas.TokenOut)
def register(payload: schemas.RegisterIn, db: Session = Depends(get_db)):
    exists = db.query(models.User).filter(
        models.User.email == payload.email.lower()).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered.")
    user = models.User(name=payload.name.strip(),
                       email=payload.email.lower(),
                       phone=normalize_phone(payload.phone),
                       password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer",
            "user": schemas.UserOut.model_validate(user)}


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.email == payload.email.lower()).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password.")
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer",
            "user": schemas.UserOut.model_validate(user)}


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user
