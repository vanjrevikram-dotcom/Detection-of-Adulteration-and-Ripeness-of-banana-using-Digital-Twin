"""Load the trained multimodal adulteration model from its checkpoint."""
import os

import torch

from custom_models.architectures.model_code import BananaMultimodalNet

_model = None


def get_adulteration_model(checkpoint_path: str):
    global _model
    if _model is not None:
        return _model
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(
            f"Adulteration model not found at {checkpoint_path}. "
            "Place best_banana_multimodal.pth in custom_models/weights/ or models/."
        )
    ckpt = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
    if isinstance(ckpt, dict) and "model" in ckpt:
        state_dict = ckpt["model"]
    elif isinstance(ckpt, dict) and "model_state_dict" in ckpt:
        state_dict = ckpt["model_state_dict"]
    elif isinstance(ckpt, dict) and "state_dict" in ckpt:
        state_dict = ckpt["state_dict"]
    else:
        state_dict = ckpt

    model = BananaMultimodalNet(num_classes=2)
    model.load_state_dict(state_dict, strict=True)
    model.eval()
    _model = model
    return _model
