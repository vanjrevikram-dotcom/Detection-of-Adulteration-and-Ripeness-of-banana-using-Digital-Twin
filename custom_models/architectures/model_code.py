"""
Architecture definitions for the banana digital-twin models.
These MUST match the architectures used during training.
Do NOT add training loops, dataset loaders, optimizers, or weights here.
"""

import torch
import torch.nn as nn
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights


# ----------------------------------------------------------------------
# Shared branches (used by BOTH ripeness and adulteration models)
# ----------------------------------------------------------------------
class EfficientNetBranch(nn.Module):
    def __init__(self, in_ch=3, out_dim=512):
        super().__init__()
        m = efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)
        if in_ch != 3:
            old = m.features[0][0]
            m.features[0][0] = nn.Conv2d(
                in_ch, old.out_channels, old.kernel_size,
                old.stride, old.padding, bias=False
            )
        for p in m.features.parameters():
            p.requires_grad = False
        self.backbone = m.features
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.proj = nn.Sequential(
            nn.Linear(m.classifier[1].in_features, out_dim),
            nn.BatchNorm1d(out_dim), nn.ReLU(), nn.Dropout(0.3),
        )

    def forward(self, x):
        with torch.no_grad():
            f = self.pool(self.backbone(x)).flatten(1)
        return self.proj(f)


class MatrixBranch(nn.Module):
    def __init__(self, out_dim=256):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(1, 16, 3, padding=1), nn.BatchNorm2d(16), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(16, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(), nn.MaxPool2d(2),
            nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Linear(64, out_dim), nn.ReLU(),
        )

    def forward(self, x):
        return self.net(x)


# ----------------------------------------------------------------------
# Ripeness model (5 stages)  →  best_ripeness_model.pth
# ----------------------------------------------------------------------
class BananaNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.rgb = EfficientNetBranch(3, 512)
        self.th  = EfficientNetBranch(3, 512)
        self.mat = MatrixBranch(256)
        self.classifier = nn.Sequential(
            nn.Linear(512 + 512 + 256, 512), nn.ReLU(),
            nn.Dropout(0.4), nn.Linear(512, 5),
        )

    def forward(self, rgb, th, mat):
        return self.classifier(
            torch.cat([self.rgb(rgb), self.th(th), self.mat(mat)], dim=1)
        )


# ----------------------------------------------------------------------
# Adulteration model (2 classes)  →  best_banana_multimodal.pth
# ----------------------------------------------------------------------
class BananaMultimodalNet(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.rgb_branch     = EfficientNetBranch(3, 512)
        self.thermal_branch = EfficientNetBranch(3, 512)
        self.matrix_branch  = MatrixBranch(256)
        self.fusion = nn.Sequential(
            nn.Linear(512 + 512 + 256, 256), nn.BatchNorm1d(256),
            nn.ReLU(), nn.Dropout(0.4),
        )
        self.classifier = nn.Linear(256, num_classes)

    def forward(self, rgb, th, mat):
        f = torch.cat(
            [self.rgb_branch(rgb), self.thermal_branch(th), self.matrix_branch(mat)],
            dim=1,
        )
        return self.classifier(self.fusion(f))


# ----------------------------------------------------------------------
# LSTM forecaster  →  lstm_forecaster.pth
# Exact architecture from lstm_training.ipynb (Cell 6)
# ----------------------------------------------------------------------
class RipenessForecaster(nn.Module):
    def __init__(self, input_dim=7, hidden=32, layers=2, n_stages=5):
        super().__init__()
        self.lstm = nn.LSTM(input_dim, hidden, layers, batch_first=True,
                            dropout=0.2 if layers > 1 else 0.0)
        self.stage_head = nn.Linear(hidden, n_stages)
        self.days_head  = nn.Sequential(nn.Linear(hidden, 16), nn.ReLU(), nn.Linear(16, 1))

    def forward(self, x, lens):
        packed = torch.nn.utils.rnn.pack_padded_sequence(x, lens, batch_first=True,
                                                          enforce_sorted=False)
        out, _ = self.lstm(packed)
        out, _ = torch.nn.utils.rnn.pad_packed_sequence(out, batch_first=True)
        last = out[torch.arange(out.size(0)), lens - 1]
        return self.stage_head(last), self.days_head(last).squeeze(-1)


LSTMForecaster = RipenessForecaster