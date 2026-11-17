import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from ..config import ALLOWED_IMAGE_EXTS, ALLOWED_MATRIX_EXTS, MAX_UPLOAD_MB, UPLOAD_DIR


def _safe_stem(name: str) -> str:
    stem = Path(name).stem
    stem = re.sub(r"[^A-Za-z0-9_-]+", "_", stem).strip("_")[:60] or "file"
    return stem


async def save_upload(upload: UploadFile, kind: str, allowed: set) -> Path:
    ext = Path(upload.filename or "").suffix.lower()
    if ext not in allowed:
        raise HTTPException(status_code=400,
                            detail=f"Invalid file type '{ext}'. Allowed: {sorted(allowed)}")
    data = await upload.read()
    size_mb = len(data) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_MB:
        raise HTTPException(status_code=400,
                            detail=f"File too large ({size_mb:.1f} MB). Max {MAX_UPLOAD_MB} MB.")
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
    dest = UPLOAD_DIR / f"{kind}_{uuid.uuid4().hex[:12]}_{_safe_stem(upload.filename or 'file')}{ext}"
    dest.write_bytes(data)
    return dest


async def save_image(upload: UploadFile, kind: str) -> Path:
    return await save_upload(upload, kind, ALLOWED_IMAGE_EXTS)


async def save_matrix(upload: UploadFile, kind: str = "matrix") -> Path:
    return await save_upload(upload, kind, ALLOWED_MATRIX_EXTS)


def public_url(path: Path) -> str:
    """Convert a storage path to a /files/... URL served by FastAPI."""
    from ..config import EXPLAIN_DIR
    try:
        rel = path.relative_to(EXPLAIN_DIR.parent)  # storage/...
    except ValueError:
        return path.name
    return "/files/" + rel.as_posix().replace("storage/", "")
