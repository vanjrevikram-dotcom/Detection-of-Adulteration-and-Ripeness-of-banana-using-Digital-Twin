from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile

from .. import models
from ..deps import get_current_user
from ..services import xai_service as xai
from ..services.matrix_shap import explain_matrix_shap
from ..utils.file_utils import save_image, save_matrix

router = APIRouter(prefix="/api/explain", tags=["xai"])


@router.post("/ripeness")
async def explain_ripeness(rgb: UploadFile, thermal: UploadFile,
                           matrix: UploadFile,
                           user: models.User = Depends(get_current_user)):
    rgb_p = await save_image(rgb, "rgb")
    th_p = await save_image(thermal, "thermal")
    mx_p = await save_matrix(matrix)
    try:
        return xai.explain_ripeness(str(rgb_p), str(th_p), str(mx_p))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"XAI error: {exc}")


@router.post("/adulteration")
async def explain_adulteration(rgb: UploadFile,
                               user: models.User = Depends(get_current_user)):
    rgb_p = await save_image(rgb, "rgb")
    try:
        return xai.explain_adulteration(str(rgb_p))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"XAI error: {exc}")


@router.post("/ripeness/rgb-gradcam")
async def explain_rgb(
    rgb: UploadFile, thermal: UploadFile, matrix: UploadFile,
    user: models.User = Depends(get_current_user),
):
    """Standalone RGB Grad-CAM triplet (combined + heatmap + overlay)."""
    rgb_p = await save_image(rgb, "rgb")
    th_p = await save_image(thermal, "thermal")
    mx_p = await save_matrix(matrix)
    try:
        return xai.explain_rgb_gradcam(str(rgb_p), str(th_p), str(mx_p))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"XAI error: {exc}")


@router.post("/ripeness/thermal-gradcam")
async def explain_thermal(
    rgb: UploadFile, thermal: UploadFile, matrix: UploadFile,
    user: models.User = Depends(get_current_user),
):
    """Standalone Thermal Grad-CAM triplet (combined + heatmap + overlay)."""
    rgb_p = await save_image(rgb, "rgb")
    th_p = await save_image(thermal, "thermal")
    mx_p = await save_matrix(matrix)
    try:
        return xai.explain_thermal_gradcam(str(rgb_p), str(th_p), str(mx_p))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"XAI error: {exc}")


@router.post("/ripeness/matrix-shap")
async def explain_matrix(
    rgb: UploadFile, thermal: UploadFile, matrix: UploadFile,
    target_class: int | None = Form(default=None),
    user: models.User = Depends(get_current_user),
):
    """REAL SHAP explanation for the thermal-matrix modality.

    Uses shap.GradientExplainer on the existing trained ripeness model with
    RGB/Thermal held fixed. No retraining, no architecture changes.
    """
    rgb_p = await save_image(rgb, "rgb")
    th_p = await save_image(thermal, "thermal")
    mx_p = await save_matrix(matrix)
    try:
        out = explain_matrix_shap(str(rgb_p), str(th_p), str(mx_p),
                                  target=target_class)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"XAI error: {exc}")
    return {
        "method": out["method"],
        "target_stage": out["target_stage"],
        "target_class_index": out["target_class_index"],
        "probability": out["probability"],
        "shap_values": out["shap_values"],
        "heatmap_url": out["heatmap_url"],
        "summary": out["summary"],
    }
