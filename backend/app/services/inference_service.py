"""Ripeness and adulteration inference services using user's trained models."""
import logging

import numpy as np
import torch

from ..config import (ADULTERATION_MODEL_PATH, RIPENESS_MODEL_PATH,
                      RIPENESS_STAGES, STAGE_RIPENESS_CENTERS)
from ..ml.adulteration_model import get_adulteration_model
from ..ml.ripeness_model import get_ripeness_model
from ..ml.transforms import (load_thermal_matrix_tensor, matrix_summary_stats,
                             neutral_thermal_matrix_tensor,
                             preprocess_adulteration_image,
                             preprocess_ripeness_image,
                             preprocess_thermal_image)

logger = logging.getLogger(__name__)


def ripeness_percentage(probs: list[float]) -> float:
    return round(float(sum(p * c for p, c in zip(probs, STAGE_RIPENESS_CENTERS))), 2)


@torch.no_grad()
def predict_ripeness(rgb_path: str, thermal_path: str, matrix_path: str) -> dict:
    model = get_ripeness_model(str(RIPENESS_MODEL_PATH))
    try:
        rgb = preprocess_ripeness_image(rgb_path).unsqueeze(0)
        thermal = preprocess_thermal_image(thermal_path).unsqueeze(0)
        matrix = load_thermal_matrix_tensor(matrix_path).unsqueeze(0)
    except (FileNotFoundError, ValueError) as exc:
        raise ValueError(str(exc)) from exc
    except Exception as exc:
        raise RuntimeError(f"Model inference error: {exc}") from exc
    try:
        logits = model(rgb, thermal, matrix)
        probs = torch.softmax(logits, dim=1)[0].tolist()
    except Exception as exc:
        raise RuntimeError(f"Model inference error: {exc}") from exc
    idx = int(max(range(len(probs)), key=lambda i: probs[i]))
    return {
        "predicted_stage": RIPENESS_STAGES[idx],
        "predicted_index": idx + 1,
        "confidence": round(float(probs[idx]), 4),
        "stage_probabilities": {s: round(float(p), 4)
                                for s, p in zip(RIPENESS_STAGES, probs)},
        "ripeness_percentage": ripeness_percentage([float(p) for p in probs]),
        "matrix_stats": matrix_summary_stats(matrix_path),
        "_probs": [float(p) for p in probs],
    }


@torch.no_grad()
def predict_adulteration(
    rgb_path: str,
    thermal_path: str | None = None,
    matrix_path: str | None = None,
) -> dict:
    model = get_adulteration_model(str(ADULTERATION_MODEL_PATH))
    incomplete_modalities = not thermal_path or not matrix_path
    try:
        rgb = preprocess_adulteration_image(rgb_path).unsqueeze(0)
        if incomplete_modalities:
            logger.warning(
                "Incomplete modalities for adulteration inference; "
                "substituting fallback thermal or matrix input."
            )
        if thermal_path:
            thermal = preprocess_thermal_image(thermal_path).unsqueeze(0)
        else:
            thermal = preprocess_thermal_image(rgb_path).unsqueeze(0)
        if matrix_path:
            matrix = load_thermal_matrix_tensor(matrix_path).unsqueeze(0)
        else:
            matrix = neutral_thermal_matrix_tensor().unsqueeze(0)
    except (FileNotFoundError, ValueError) as exc:
        raise ValueError(str(exc)) from exc
    except Exception as exc:
        raise RuntimeError(f"Model inference error: {exc}") from exc
    try:
        logits = model(rgb, thermal, matrix)
        if incomplete_modalities:
            logits = logits / 1.5
        probs = torch.softmax(logits, dim=1)[0]
        if incomplete_modalities:
            probs = probs * 0.9 + 0.05
        probs = probs.tolist()
    except Exception as exc:
        raise RuntimeError(f"Model inference error: {exc}") from exc

    # Class 0 = Natural, Class 1 = Adulterated (exact ordering from training)
    p_nat, p_adult = float(probs[0]), float(probs[1])
    status = "Adulterated" if p_adult >= p_nat else "Natural"
    conf = max(p_adult, p_nat)
    disclaimer = ("AI-estimated likelihood, not chemical concentration "
                  "and not laboratory certification.")
    if incomplete_modalities:
        disclaimer += (
            " With missing thermal or matrix input, scores are temperature-scaled "
            "and smoothed for demonstration; they are not calibrated."
        )
    return {
        "status": status,
        "confidence": round(conf, 4),
        "natural_probability": round(p_nat, 4),
        "adulterated_probability": round(p_adult, 4),
        "disclaimer": disclaimer,
        "_probs": [p_nat, p_adult],
    }


def probs_for_triplet(rgb_path: str, thermal_path: str, matrix_path: str) -> np.ndarray:
    """Computes exact 7-dim probability vector matching lstm_training.ipynb:
    [p_stage1..p_stage5, p_natural, p_adulterated]
    """
    ripe = predict_ripeness(rgb_path, thermal_path, matrix_path)
    adult = predict_adulteration(rgb_path, thermal_path, matrix_path)
    return np.array(ripe["_probs"] + adult["_probs"], dtype=np.float32)
