"""Inference-time preprocessing matching training (no pandas dependency)."""
import csv
import re
from pathlib import Path

import numpy as np
import torch
from openpyxl import load_workbook
from PIL import Image, ImageOps
from torchvision.transforms import InterpolationMode
import torchvision.transforms.functional as TF

_ADULT_MEAN = [0.485, 0.456, 0.406]
_ADULT_STD = [0.229, 0.224, 0.225]


def _load_pil(path: str | Path) -> Image.Image:
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)
    return img.convert("RGB")


def preprocess_ripeness_image(path: str | Path) -> torch.Tensor:
    """Resize 256 -> center-crop 224 -> ToTensor -> ImageNet Normalize."""
    img = _load_pil(path)
    img = TF.resize(img, [256, 256], interpolation=InterpolationMode.BILINEAR)
    img = TF.center_crop(img, [224, 224])
    t = TF.to_tensor(img)
    return TF.normalize(t, mean=_ADULT_MEAN, std=_ADULT_STD)


def preprocess_thermal_image(path: str | Path) -> torch.Tensor:
    """Load thermal -> convert L -> resize 224x224 -> RGB -> resize 256 -> center-crop 224 -> Normalize."""
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)
    img = img.convert("L").resize((224, 224)).convert("RGB")
    img = TF.resize(img, [256, 256], interpolation=InterpolationMode.BILINEAR)
    img = TF.center_crop(img, [224, 224])
    t = TF.to_tensor(img)
    return TF.normalize(t, mean=_ADULT_MEAN, std=_ADULT_STD)


def preprocess_adulteration_image(path: str | Path) -> torch.Tensor:
    """Resize 256 -> center-crop 224 -> ToTensor -> ImageNet Normalize."""
    return preprocess_ripeness_image(path)


def neutral_thermal_tensor() -> torch.Tensor:
    """Neutral 3x224x224 tensor for fallback."""
    return torch.zeros((3, 224, 224), dtype=torch.float32)


def neutral_thermal_matrix_tensor() -> torch.Tensor:
    """Neutral standardized 1x64x48 thermal matrix tensor for fallback."""
    return torch.zeros((1, 64, 48), dtype=torch.float32)


def _parse_temp(value) -> float:
    if value is None:
        return float("nan")
    if isinstance(value, (int, float, np.integer, np.floating)):
        return float(value)
    m = re.search(r"-?\d+(?:\.\d+)?", str(value))
    return float(m.group()) if m else float("nan")


def _read_raw_matrix(path: str | Path) -> np.ndarray:
    p = str(path)
    if p.lower().endswith(".csv"):
        with open(p, newline="") as f:
            rows = list(csv.reader(f))
        return np.array([[_parse_temp(v) for v in r] for r in rows],
                        dtype=np.float32)
    wb = load_workbook(p, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    width = max((len(r) for r in rows), default=0)
    arr = np.full((len(rows), width), np.nan, dtype=np.float32)
    for i, r in enumerate(rows):
        for j, v in enumerate(r):
            arr[i, j] = _parse_temp(v)
    return arr


def load_thermal_matrix_tensor(path: str | Path) -> torch.Tensor:
    """Parse XLSX/CSV thermal matrix -> standardized [1, 64, 48] tensor."""
    numeric = _read_raw_matrix(path)
    if numeric.size == 0:
        raise ValueError("Thermal matrix file is empty or unreadable.")
    valid_cols = np.sum(np.isfinite(numeric), axis=0) > numeric.shape[0] * 0.5
    numeric = numeric[:, valid_cols]
    valid_rows = np.sum(np.isfinite(numeric), axis=1) > numeric.shape[1] * 0.5
    numeric = numeric[valid_rows, :]
    if numeric.shape[0] == 256 and numeric.shape[1] >= 192:
        numeric = numeric[:, :192]
    if numeric.shape != (256, 192):
        raise ValueError(
            f"Thermal matrix must resolve to 256x192 cells, got {numeric.shape}.")
    if np.isnan(numeric).any():
        numeric = np.nan_to_num(numeric, nan=float(np.nanmean(numeric)))
    numeric = numeric.astype(np.float32)
    mean, std = float(numeric.mean()), float(numeric.std())
    if std < 1e-6:
        std = 1.0
    numeric = (numeric - mean) / std
    t = torch.from_numpy(numeric).unsqueeze(0).unsqueeze(0)  # [1,1,256,192]
    t = torch.nn.functional.interpolate(t, size=(64, 48), mode="bilinear",
                                        align_corners=False)
    return t.squeeze(0)  # [1,64,48]


def matrix_summary_stats(path: str | Path) -> dict:
    """Raw (unstandardized) stats for display + XAI context."""
    numeric = _read_raw_matrix(path)
    valid = numeric[np.isfinite(numeric)]
    if valid.size == 0:
        raise ValueError("No numeric temperature data found in matrix file.")
    return {
        "min": float(valid.min()), "max": float(valid.max()),
        "mean": float(valid.mean()), "std": float(valid.std()),
        "shape": list(numeric.shape),
    }
