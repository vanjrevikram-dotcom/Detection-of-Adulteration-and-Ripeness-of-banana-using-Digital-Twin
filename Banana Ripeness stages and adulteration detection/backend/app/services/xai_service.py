"""Explainability: Grad-CAM + REAL SHAP for the thermal matrix.

- Ripeness RGB / Thermal -> Grad-CAM on each EfficientNet branch
- Ripeness matrix -> REAL SHAP via shap.GradientExplainer (see matrix_shap.py)
- Adulteration RGB -> Grad-CAM
Artifacts saved under backend/storage/explanations/, URLs returned.
"""
import io
import logging
import uuid
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import torch
from PIL import Image

from ..config import ADULTERATION_MODEL_PATH, EXPLAIN_DIR, RIPENESS_MODEL_PATH
from ..ml.adulteration_model import get_adulteration_model
from ..ml.ripeness_model import get_ripeness_model
from ..ml.transforms import (load_thermal_matrix_tensor,
                             neutral_thermal_matrix_tensor,
                             preprocess_adulteration_image,
                             preprocess_ripeness_image,
                             preprocess_thermal_image)
from .matrix_shap import explain_matrix_shap

logger = logging.getLogger(__name__)


class _GradCAM:
    def __init__(self, model: torch.nn.Module, target_layer: torch.nn.Module):
        self.model = model
        self.activations, self.gradients = None, None
        target_layer.register_forward_hook(self._fwd)
        target_layer.register_full_backward_hook(self._bwd)

    def _fwd(self, module, inp, out):
        self.activations = out.detach()

    def _bwd(self, module, gin, gout):
        self.gradients = gout[0].detach()

    def __call__(self, score: torch.Tensor) -> np.ndarray:
        self.model.zero_grad(set_to_none=True)
        score.backward(retain_graph=True)
        acts, grads = self.activations[0], self.gradients[0]  # [C,H,W]
        weights = grads.mean(dim=(1, 2), keepdim=True)
        cam = (weights * acts).sum(dim=0)
        cam = torch.relu(cam)
        cam = cam / (cam.max() + 1e-8)
        return cam.cpu().numpy()


def _colored_heatmap(cam: np.ndarray) -> Image.Image:
    heat = Image.fromarray((cam * 255).astype(np.uint8)).resize((224, 224),
                                                                Image.BILINEAR)
    cmap = plt.get_cmap("jet")
    colored = (cmap(np.asarray(heat) / 255.0)[:, :, :3] * 255).astype(np.uint8)
    return Image.fromarray(colored)


def _overlay(original_path: str, cam: np.ndarray, out_path: Path,
             title: str) -> None:
    base = Image.open(original_path).convert("RGB").resize((224, 224))
    colored = _colored_heatmap(cam)
    blended = Image.blend(base, colored, alpha=0.45)
    fig, ax = plt.subplots(1, 3, figsize=(9, 3))
    for a, im, t in zip(ax, [base, colored, blended],
                        ["Input", "Grad-CAM", "Overlay"]):
        a.imshow(im); a.set_title(t, fontsize=9); a.axis("off")
    fig.suptitle(title, fontsize=10)
    fig.tight_layout()
    fig.savefig(out_path, dpi=120, bbox_inches="tight")
    plt.close(fig)


def _gradcam_triplet(original_path: str, cam: np.ndarray, base_name: str,
                     title: str) -> dict:
    """Save combined + standalone heatmap + standalone overlay artifacts.

    Purely additive artifact generation; inference logic is untouched.
    """
    base = Image.open(original_path).convert("RGB").resize((224, 224))
    colored = _colored_heatmap(cam)
    blended = Image.blend(base, colored, alpha=0.45)
    urls = {}
    p_all = _save(base_name)
    _overlay(original_path, cam, p_all, title)
    urls["combined_url"] = "/files/explanations/" + p_all.name
    p_heat = _save(base_name + "_heatmap")
    colored.save(p_heat)
    urls["heatmap_url"] = "/files/explanations/" + p_heat.name
    p_over = _save(base_name + "_overlay")
    blended.save(p_over)
    urls["overlay_url"] = "/files/explanations/" + p_over.name
    return urls


def _save(png_name: str) -> Path:
    return EXPLAIN_DIR / f"{png_name}_{uuid.uuid4().hex[:8]}.png"


def _last_conv(features: torch.nn.Sequential):
    # EfficientNet-B0: features[-1] is the final conv block
    return features[-1]


def _ripeness_forward(model, rgb, thermal, matrix, grad_branch=None):
    if grad_branch == "rgb":
        rgb_features = model.rgb.proj(
            model.rgb.pool(model.rgb.backbone(rgb)).flatten(1)
        )
    else:
        rgb_features = model.rgb(rgb)

    if grad_branch == "thermal":
        thermal_features = model.th.proj(
            model.th.pool(model.th.backbone(thermal)).flatten(1)
        )
    else:
        thermal_features = model.th(thermal)

    matrix_features = model.mat(matrix)
    return model.classifier(
        torch.cat([rgb_features, thermal_features, matrix_features], dim=1)
    )


def _adulteration_forward(model, rgb, thermal, matrix, grad_rgb=False):
    rgb_branch = model.rgb_branch
    rgb_features = (
        rgb_branch.proj(rgb_branch.pool(rgb_branch.backbone(rgb)).flatten(1))
        if grad_rgb else rgb_branch(rgb)
    )
    features = torch.cat(
        [rgb_features, model.thermal_branch(thermal),
         model.matrix_branch(matrix)],
        dim=1,
    )
    return model.classifier(model.fusion(features))


@torch.no_grad()
def _ripeness_tensors(rgb_path, thermal_path, matrix_path):
    return (preprocess_ripeness_image(rgb_path).unsqueeze(0),
            preprocess_thermal_image(thermal_path).unsqueeze(0),
            load_thermal_matrix_tensor(matrix_path).unsqueeze(0))


def explain_ripeness(rgb_path: str, thermal_path: str, matrix_path: str,
                     target: int | None = None) -> dict:
    model = get_ripeness_model(str(RIPENESS_MODEL_PATH))
    model.eval()
    rgb, thermal, matrix = _ripeness_tensors(rgb_path, thermal_path, matrix_path)
    with torch.no_grad():
        logits = model(rgb, thermal, matrix)
        probs = torch.softmax(logits, dim=1)[0]
    pred = int(probs.argmax()) if target is None else int(target)
    outputs = {}
    # RGB Grad-CAM (same forward/backward pass as before).
    cam_rgb = _GradCAM(model, _last_conv(model.rgb.backbone))
    rgb_r = preprocess_ripeness_image(rgb_path).unsqueeze(0).requires_grad_(True)
    th_r = preprocess_thermal_image(thermal_path).unsqueeze(0)
    mx_r = load_thermal_matrix_tensor(matrix_path).unsqueeze(0)
    s = _ripeness_forward(model, rgb_r, th_r, mx_r, "rgb")[0, pred]
    cam = cam_rgb(s)
    trip = _gradcam_triplet(rgb_path, cam, "gradcam_ripeness_rgb",
                            f"Ripeness RGB Grad-CAM (class {pred})")
    outputs["gradcam_rgb_url"] = trip["combined_url"]
    outputs["gradcam_rgb_heatmap_url"] = trip["heatmap_url"]
    outputs["gradcam_rgb_overlay_url"] = trip["overlay_url"]

    # Thermal Grad-CAM (same forward/backward pass as before).
    cam_th = _GradCAM(model, _last_conv(model.th.backbone))
    rgb2 = preprocess_ripeness_image(rgb_path).unsqueeze(0)
    th2 = preprocess_thermal_image(thermal_path).unsqueeze(0).requires_grad_(True)
    mx2 = load_thermal_matrix_tensor(matrix_path).unsqueeze(0)
    s2 = _ripeness_forward(model, rgb2, th2, mx2, "thermal")[0, pred]
    cam2 = cam_th(s2)
    trip2 = _gradcam_triplet(thermal_path, cam2, "gradcam_ripeness_thermal",
                             f"Ripeness Thermal Grad-CAM (class {pred})")
    outputs["gradcam_thermal_url"] = trip2["combined_url"]
    outputs["gradcam_thermal_heatmap_url"] = trip2["heatmap_url"]
    outputs["gradcam_thermal_overlay_url"] = trip2["overlay_url"]

    # Thermal-matrix explanation: REAL SHAP (shap.GradientExplainer).
    shap_out = explain_matrix_shap(rgb_path, thermal_path, matrix_path,
                                   target=pred)
    outputs["matrix_importance_url"] = shap_out["heatmap_url"]
    outputs["matrix_shap"] = {
        "method": shap_out["method"],
        "target_stage": shap_out["target_stage"],
        "target_class_index": shap_out["target_class_index"],
        "probability": shap_out["probability"],
        "summary": shap_out["summary"],
    }
    outputs["method"] = ("Grad-CAM (RGB/Thermal) + SHAP GradientExplainer "
                         "(thermal matrix).")
    outputs["target_class"] = pred
    return outputs


def explain_rgb_gradcam(rgb_path: str, thermal_path: str, matrix_path: str,
                        target: int | None = None) -> dict:
    """Standalone RGB Grad-CAM triplet for the ripeness model."""
    model = get_ripeness_model(str(RIPENESS_MODEL_PATH))
    model.eval()
    rgb, thermal, matrix = _ripeness_tensors(rgb_path, thermal_path, matrix_path)
    with torch.no_grad():
        probs = torch.softmax(model(rgb, thermal, matrix), dim=1)[0]
    pred = int(probs.argmax()) if target is None else int(target)
    cam_mod = _GradCAM(model, _last_conv(model.rgb.backbone))
    rgb_r = preprocess_ripeness_image(rgb_path).unsqueeze(0).requires_grad_(True)
    s = _ripeness_forward(
        model, rgb_r, preprocess_thermal_image(thermal_path).unsqueeze(0),
        load_thermal_matrix_tensor(matrix_path).unsqueeze(0), "rgb"
    )[0, pred]
    cam = cam_mod(s)
    trip = _gradcam_triplet(rgb_path, cam, "gradcam_ripeness_rgb",
                            f"Ripeness RGB Grad-CAM (class {pred})")
    return {"method": "Grad-CAM", "target_class": pred,
            "probability": round(float(probs[pred]), 4), **trip}


def explain_thermal_gradcam(rgb_path: str, thermal_path: str, matrix_path: str,
                            target: int | None = None) -> dict:
    """Standalone Thermal Grad-CAM triplet for the ripeness model."""
    model = get_ripeness_model(str(RIPENESS_MODEL_PATH))
    model.eval()
    rgb, thermal, matrix = _ripeness_tensors(rgb_path, thermal_path, matrix_path)
    with torch.no_grad():
        probs = torch.softmax(model(rgb, thermal, matrix), dim=1)[0]
    pred = int(probs.argmax()) if target is None else int(target)
    cam_mod = _GradCAM(model, _last_conv(model.th.backbone))
    th_r = preprocess_thermal_image(thermal_path).unsqueeze(0).requires_grad_(True)
    s = _ripeness_forward(
        model, preprocess_ripeness_image(rgb_path).unsqueeze(0), th_r,
        load_thermal_matrix_tensor(matrix_path).unsqueeze(0), "thermal"
    )[0, pred]
    cam = cam_mod(s)
    trip = _gradcam_triplet(thermal_path, cam, "gradcam_ripeness_thermal",
                            f"Ripeness Thermal Grad-CAM (class {pred})")
    return {"method": "Grad-CAM", "target_class": pred,
            "probability": round(float(probs[pred]), 4), **trip}


def explain_adulteration(
    rgb_path: str,
    thermal_path: str | None = None,
    matrix_path: str | None = None,
    target: int | None = None,
) -> dict:
    model = get_adulteration_model(str(ADULTERATION_MODEL_PATH))
    model.eval()
    if not thermal_path or not matrix_path:
        logger.warning(
            "Incomplete modalities for adulteration explanation; "
            "substituting fallback thermal or matrix input."
        )
    x0 = preprocess_adulteration_image(rgb_path).unsqueeze(0)
    th0 = preprocess_thermal_image(thermal_path or rgb_path).unsqueeze(0)
    mat0 = (load_thermal_matrix_tensor(matrix_path).unsqueeze(0)
            if matrix_path else neutral_thermal_matrix_tensor().unsqueeze(0))
    with torch.no_grad():
        probs = torch.softmax(_adulteration_forward(model, x0, th0, mat0), dim=1)[0]
    pred = int(probs.argmax()) if target is None else int(target)
    cam_mod = _GradCAM(model, _last_conv(model.rgb_branch.backbone))
    x = preprocess_adulteration_image(rgb_path).unsqueeze(0).requires_grad_(True)
    s = _adulteration_forward(model, x, th0, mat0, grad_rgb=True)[0, pred]
    cam = cam_mod(s)
    p = _save("gradcam_adulteration")
    _overlay(rgb_path, cam, p, f"Adulteration RGB Grad-CAM (class {pred})")
    return {"gradcam_rgb_url": "/files/explanations/" + p.name,
            "method": "Grad-CAM on EfficientNet-B0 backbone.",
            "target_class": pred}
