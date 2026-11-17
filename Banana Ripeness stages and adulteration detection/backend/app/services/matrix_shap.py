"""REAL SHAP explanation for the thermal-matrix modality.

Uses the actual ``shap`` package (``shap.GradientExplainer``) on the existing,
unmodified trained ripeness model. RGB and Thermal are held fixed while the
matrix input varies, so the returned SHAP values estimate each of the 64x48
matrix features' contribution to the selected ripeness-class logit.

SHAP GradientExplainer is used to estimate the contribution of
thermal-matrix features to the selected ripeness prediction.
"""
import uuid

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import TwoSlopeNorm
import numpy as np
import shap
import torch

from ..config import (EXPLAIN_DIR, RIPENESS_MODEL_PATH, RIPENESS_STAGES,
                      SHAP_BACKGROUND_K, SHAP_BG_DIR, SHAP_BG_MAX, SHAP_NSAMPLES)
from ..ml.ripeness_model import get_ripeness_model
from ..ml.transforms import (load_thermal_matrix_tensor,
                             preprocess_ripeness_image,
                             preprocess_thermal_image)

METHOD = "SHAP GradientExplainer"


class MatrixLogitWrapper(torch.nn.Module):
    """Holds RGB/Thermal fixed; exposes Matrix -> 5-class logits.

    Wraps the existing trained model WITHOUT altering it, so SHAP can
    explain the matrix modality alone.
    """

    def __init__(self, base: torch.nn.Module, rgb_fixed: torch.Tensor,
                 thermal_fixed: torch.Tensor):
        super().__init__()
        self.base = base
        self.register_buffer("rgb_fixed", rgb_fixed)
        self.register_buffer("thermal_fixed", thermal_fixed)

    def forward(self, matrix: torch.Tensor) -> torch.Tensor:
        b = matrix.shape[0]
        rgb = self.rgb_fixed.expand(b, -1, -1, -1)
        thermal = self.thermal_fixed.expand(b, -1, -1, -1)
        return self.base(rgb, thermal, matrix)


def _pool_files():
    files = sorted(SHAP_BG_DIR.glob("*.npy"),
                   key=lambda p: p.stat().st_mtime)
    return files


def _stash_to_pool(matrix_1x64x48: torch.Tensor) -> None:
    """Cache an uploaded matrix tensor for future background sets (FIFO cap)."""
    try:
        arr = matrix_1x64x48.detach().cpu().numpy().astype(np.float32)
        np.save(SHAP_BG_DIR / f"bg_{uuid.uuid4().hex[:8]}.npy", arr)
        files = _pool_files()
        while len(files) > SHAP_BG_MAX:
            files.pop(0).unlink(missing_ok=True)
    except Exception:
        pass  # pooling must never break explanations


def _build_background(current: torch.Tensor, k: int) -> torch.Tensor:
    """Small representative background set: cached deployment matrices,
    topped up with seeded noise-augmented copies of the current sample."""
    mats = []
    for f in _pool_files()[-max(k - 1, 0):]:
        try:
            a = np.load(f)
            if a.shape == (1, 64, 48):
                mats.append(torch.from_numpy(a))
        except Exception:
            continue
    rng = torch.Generator().manual_seed(0)
    while len(mats) < k:
        noise = torch.randn(current.shape, generator=rng) * 0.05
        mats.append((current + noise).clamp(-4.0, 4.0))
    bg = torch.cat(mats[:k], dim=0)
    return bg


def _save_figure(matrix_img: np.ndarray, signed: np.ndarray,
                 magnitude: np.ndarray, title: str) -> str:
    fig, ax = plt.subplots(1, 3, figsize=(10.5, 3.6))
    im0 = ax[0].imshow(matrix_img, cmap="Oranges", aspect="auto")
    ax[0].set_title("Model-seen matrix input (64x48)", fontsize=9)
    plt.colorbar(im0, ax=ax[0], fraction=0.046)
    vmax = float(np.abs(signed).max()) or 1.0
    im1 = ax[1].imshow(signed, cmap="RdBu_r", aspect="auto",
                       norm=TwoSlopeNorm(vmin=-vmax, vcenter=0.0, vmax=vmax))
    ax[1].set_title("Signed SHAP values (red +, blue -)", fontsize=9)
    plt.colorbar(im1, ax=ax[1], fraction=0.046)
    im2 = ax[2].imshow(magnitude, cmap="hot", aspect="auto")
    ax[2].set_title("|SHAP| importance", fontsize=9)
    plt.colorbar(im2, ax=ax[2], fraction=0.046)
    for a in ax:
        a.set_xticks([]); a.set_yticks([])
    fig.suptitle(title, fontsize=10)
    fig.tight_layout()
    out = EXPLAIN_DIR / f"matrix_shap_{uuid.uuid4().hex[:8]}.png"
    fig.savefig(out, dpi=130, bbox_inches="tight")
    plt.close(fig)
    return "/files/explanations/" + out.name


def explain_matrix_shap(rgb_path: str, thermal_path: str, matrix_path: str,
                        target: int | None = None,
                        background_k: int = SHAP_BACKGROUND_K,
                        nsamples: int = SHAP_NSAMPLES) -> dict:
    """Run REAL SHAP (shap.GradientExplainer) for the matrix modality."""
    model = get_ripeness_model(str(RIPENESS_MODEL_PATH))
    model.eval()
    rgb = preprocess_ripeness_image(rgb_path).unsqueeze(0)
    thermal = preprocess_thermal_image(thermal_path).unsqueeze(0)
    matrix = load_thermal_matrix_tensor(matrix_path).unsqueeze(0)

    with torch.no_grad():
        logits = model(rgb, thermal, matrix)
        probs = torch.softmax(logits, dim=1)[0]
    pred = int(probs.argmax()) if target is None else int(target)
    if not 0 <= pred <= 4:
        raise ValueError(f"target_class must be 0-4, got {target}")
    probability = round(float(probs[pred]), 4)

    background_k = max(4, min(int(background_k), 16))
    nsamples = max(5, int(nsamples))
    bg = _build_background(matrix, background_k)

    wrapper = MatrixLogitWrapper(model, rgb, thermal)
    wrapper.eval()
    try:
        explainer = shap.GradientExplainer(wrapper, bg)
        raw = explainer.shap_values(matrix, nsamples=nsamples)
    finally:
        # GradientExplainer must not leave the shared model in train mode.
        model.eval()
    if isinstance(raw, list):
        arr = np.array(raw[pred])
    else:
        arr = np.array(raw)
        if arr.shape[-1] == 5 and arr.ndim == 5:
            arr = arr[..., pred]
    arr = np.array(arr, dtype=np.float64).reshape(-1, 64, 48)[0]
    if arr.shape != (64, 48):
        raise RuntimeError(f"Unexpected SHAP map shape {arr.shape}")

    magnitude = np.abs(arr)
    mean_abs = float(magnitude.mean())
    max_abs = float(magnitude.max())
    _stash_to_pool(matrix)

    title = (f"SHAP Explanation — {RIPENESS_STAGES[pred]} "
             f"(p={probability:.3f}, mean|SHAP|={mean_abs:.2e}, max={max_abs:.2e})")
    heatmap_url = _save_figure(matrix[0, 0].cpu().numpy(), arr, magnitude, title)
    return {
        "method": METHOD,
        "target_stage": RIPENESS_STAGES[pred],
        "target_class_index": pred,
        "probability": probability,
        "shap_values": np.round(arr, 6).tolist(),
        "heatmap_url": heatmap_url,
        # Backwards-compatible alias used by the combined-analysis UI.
        "matrix_importance_url": heatmap_url,
        "summary": {"mean_abs_shap": mean_abs, "max_abs_shap": max_abs},
        "background_size": int(bg.shape[0]),
        "nsamples": int(nsamples),
    }
