from fastapi import HTTPException
from sqlalchemy.orm import Session

from .. import models


def next_twin_id(db: Session) -> str:
    last = db.query(models.BananaTwin).order_by(
        models.BananaTwin.id.desc()).first()
    n = (last.id + 1) if last else 1
    while db.query(models.BananaTwin).filter(
            models.BananaTwin.twin_id == f"BT-{n:06d}").first():
        n += 1
    return f"BT-{n:06d}"


def get_or_auto_create_twin(db: Session, user: models.User,
                            twin_id: str | None,
                            twin_name: str | None) -> tuple[models.BananaTwin, bool]:
    """Resolve the target Twin for an analysis.

    - Explicit twin_id: must belong to the user (404 otherwise). Never creates.
    - No twin_id: auto-creates a new Twin with a unique BT-XXXXXX id, using the
      optional banana name or a generated default. The analysis becomes its
      first observation.
    Returns (twin, created).
    """
    if twin_id:
        twin = db.query(models.BananaTwin).filter(
            models.BananaTwin.twin_id == twin_id,
            models.BananaTwin.owner_user_id == user.id).first()
        if twin is None:
            raise HTTPException(status_code=404, detail="Digital Twin not found.")
        return twin, False
    tid = next_twin_id(db)
    name = (twin_name or "").strip() or f"Banana {tid}"
    twin = models.BananaTwin(twin_id=tid, owner_user_id=user.id, name=name[:120])
    db.add(twin)
    db.commit()
    db.refresh(twin)
    return twin, True
