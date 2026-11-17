"""Exact LSTM forecaster architecture matching user's trained weights (weights/lstm_forecaster.pth)."""
import os
import torch
import torch.nn as nn


class RipenessForecaster(nn.Module):
    def __init__(self, input_dim=7, hidden=32, layers=2, n_stages=5):
        super().__init__()
        self.lstm = nn.LSTM(
            input_dim, hidden, layers, batch_first=True,
            dropout=0.2 if layers > 1 else 0.0
        )
        self.stage_head = nn.Linear(hidden, n_stages)
        self.days_head  = nn.Sequential(nn.Linear(hidden, 16), nn.ReLU(), nn.Linear(16, 1))

    def forward(self, x, lens):
        packed = torch.nn.utils.rnn.pack_padded_sequence(
            x, lens, batch_first=True, enforce_sorted=False
        )
        out, _ = self.lstm(packed)
        out, _ = torch.nn.utils.rnn.pad_packed_sequence(out, batch_first=True)
        last = out[torch.arange(out.size(0)), lens - 1]
        return self.stage_head(last), self.days_head(last).squeeze(-1)


_model = None


def get_lstm_model(checkpoint_path: str):
    global _model
    if _model is not None:
        return _model
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(
            f"LSTM model not found at {checkpoint_path}. "
            "Place lstm_forecaster.pth in custom_models/weights/ or models/."
        )
    ckpt = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
    input_dim = ckpt.get("input_dim", 7) if isinstance(ckpt, dict) else 7
    hidden = ckpt.get("hidden", 32) if isinstance(ckpt, dict) else 32
    sd = ckpt["model"] if isinstance(ckpt, dict) and "model" in ckpt else (
        ckpt.get("model_state_dict", ckpt) if isinstance(ckpt, dict) else ckpt
    )

    model = RipenessForecaster(input_dim=input_dim, hidden=hidden, layers=2, n_stages=5)
    model.load_state_dict(sd, strict=True)
    model.eval()
    _model = model
    return _model

