"""Digital-twin forecasting service powered by trained LSTM model (weights/lstm_forecaster.pth).

Replaces heuristic-based future-stage prediction with the exact LSTM architecture
trained in custom_models/training_notebooks/lstm_training.ipynb.
"""
import os
from typing import Any, List, Optional
import numpy as np
import torch

from ..config import LSTM_MODEL_PATH, RIPENESS_STAGES
from ..ml.lstm_forecaster import get_lstm_model

STAGE_TO_IDX = {s: i for i, s in enumerate(RIPENESS_STAGES)}


class BaseForecaster:
    name = "base"

    def forecast(
        self,
        current_stage: str,
        history: List[Any],
        current_vec: Optional[np.ndarray] = None,
    ) -> dict:
        raise NotImplementedError


class LSTMForecasterService(BaseForecaster):
    """LSTM-based forecaster using the trained 7-feature sequence model."""
    name = "lstm-forecaster"

    def __init__(self, checkpoint_path: Optional[str] = None):
        self.checkpoint_path = checkpoint_path or str(LSTM_MODEL_PATH)
        self._model = None

    def _get_model(self):
        if self._model is None:
            self._model = get_lstm_model(self.checkpoint_path)
        return self._model

    def _obs_to_vector(self, o: Any) -> np.ndarray:
        """Convert an observation to a 7-dim probability vector:
        [p_stage1..p_stage5, p_natural, p_adulterated]
        """
        # 1. Check if observation has raw files on disk to compute exact probs
        rgb_path = getattr(o, "rgb_file_path", None) or (o.get("rgb_file_path") if isinstance(o, dict) else None)
        th_path = getattr(o, "thermal_file_path", None) or (o.get("thermal_file_path") if isinstance(o, dict) else None)
        mx_path = getattr(o, "matrix_file_path", None) or (o.get("matrix_file_path") if isinstance(o, dict) else None)

        if rgb_path and th_path and mx_path and os.path.exists(rgb_path) and os.path.exists(th_path) and os.path.exists(mx_path):
            try:
                from .inference_service import probs_for_triplet
                return probs_for_triplet(rgb_path, th_path, mx_path)
            except Exception:
                pass

        # 2. Reconstruct from observation fields
        stage_name = getattr(o, "predicted_stage", None) or (o.get("predicted_stage") if isinstance(o, dict) else None)
        conf = getattr(o, "confidence", None) or (o.get("confidence") if isinstance(o, dict) else None) or 0.85
        a_status = getattr(o, "adulteration_status", None) or (o.get("adulteration_status") if isinstance(o, dict) else None)
        a_prob = getattr(o, "adulteration_probability", None) or (o.get("adulteration_probability") if isinstance(o, dict) else None)

        vec = np.zeros(7, dtype=np.float32)

        # Ripeness 5 classes
        if stage_name in STAGE_TO_IDX:
            idx = STAGE_TO_IDX[stage_name]
            rem = (1.0 - conf) / 4.0
            vec[:5] = rem
            vec[idx] = conf
        else:
            vec[:5] = 0.20

        # Adulteration 2 classes: index 5 = Natural, index 6 = Adulterated
        if a_prob is not None:
            vec[6] = float(a_prob)
            vec[5] = float(1.0 - a_prob)
        elif a_status == "Adulterated":
            vec[6] = 0.85
            vec[5] = 0.15
        else:
            vec[5] = 0.90
            vec[6] = 0.10

        return vec

    def forecast(
        self,
        current_stage: str,
        history: List[Any],
        current_vec: Optional[np.ndarray] = None,
    ) -> dict:
        vectors = []
        for o in history:
            v = self._obs_to_vector(o)
            vectors.append(v)

        if current_vec is not None:
            vectors.append(current_vec.astype(np.float32))

        if not vectors:
            # Synthetic single observation from current_stage
            cur_idx = STAGE_TO_IDX.get(current_stage, 0)
            v = np.full(7, 0.05, dtype=np.float32)
            v[cur_idx] = 0.80
            v[5] = 0.90  # Natural
            v[6] = 0.10  # Adulterated
            vectors.append(v)

        if len(vectors) > 5:
            vectors = vectors[-5:]
        elif len(vectors) < 3:
            vectors = [vectors[0].copy() for _ in range(3 - len(vectors))] + vectors

        # Sequence tensor: shape (1, T, 7)
        seq = torch.tensor(np.stack(vectors), dtype=torch.float32).unsqueeze(0)
        lens = torch.tensor([seq.size(1)])

        model = self._get_model()
        model.eval()
        with torch.no_grad():
            p_stage, p_days = model(seq, lens)

        pred_idx = int(p_stage.argmax(1).item())
        stage_probs = torch.softmax(p_stage, dim=1)[0]
        prob = round(float(stage_probs[pred_idx].item()), 4)
        days = float(p_days.item())
        days_clean = max(0.1, round(days, 2))

        future_stage = RIPENESS_STAGES[pred_idx]
        cur_idx = STAGE_TO_IDX.get(current_stage, 0)

        if cur_idx >= 4 and pred_idx >= 4:
            eta = f"Terminal stage — monitor for spoilage (LSTM est. {days_clean:.1f} days)."
        else:
            eta = f"Approx. {days_clean:.1f} days (estimated by trained digital-twin LSTM forecaster)."

        return {
            "current_stage": current_stage,
            "future_stage": future_stage,
            "probability": prob,
            "estimated_time": eta,
            "days_to_next": days_clean,
            "method": self.name,
        }


def get_forecaster(name: str = "lstm-forecaster") -> BaseForecaster:
    if name != "lstm-forecaster":
        raise ValueError(f"Unknown forecaster '{name}'")
    return LSTMForecasterService()


def build_forecast(
    current_stage: str,
    observations: List[Any],
    current_vec: Optional[np.ndarray] = None,
) -> dict:
    return get_forecaster("lstm-forecaster").forecast(
        current_stage, observations, current_vec=current_vec
    )
