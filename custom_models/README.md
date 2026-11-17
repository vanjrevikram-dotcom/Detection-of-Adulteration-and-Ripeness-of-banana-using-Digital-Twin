
# Custom Banana ML Models

## 1. Ripeness Model
Checkpoint: weights/best_ripeness_model.pth
Architecture: architectures/ripeness_model.py
Purpose: Predict current banana ripeness stage.

## 2. Adulteration Model
Checkpoint: weights/best_banana_multimodal.pth
Architecture: architectures/adulteration_model.py
Purpose: Predict natural or adulterated banana.

## 3. Digital Twin LSTM
Checkpoint: weights/lstm_forecaster.pth
Architecture: architectures/model_code.py
Purpose: Predict future ripeness stages and estimated times.

## 4. Preprocessing
Contains the exact preprocessing required by the trained models.
Must match the original training pipeline.

## 5. 3D Asset
Location: ../assets/banana.glb
Purpose: 3D banana visualization.
