# 🔧 Old Training Scripts (Archive)

This folder contains the original training and experimental scripts used during model development.

## ⚠️ Important Note

These scripts are **ARCHIVED** and not part of the main prediction pipeline.

The production pipeline uses:
- `predict_future_emissions.py` (main prediction engine)
- `visualize_predictions.py` (visualization generator)

## Folder Contents

### training_models/
Original model training scripts:
- `new_XGboost.py` - XGBoost model training with explainability
- `new_train.py` - Ensemble model training (XGBoost + RandomForest)
- `train_idust.py` - Basic XGBoost training
- `predict_indu.py` - Early prediction script
- `industry_target_vs_predicted_with_recommendations.py` - Target comparison with recommendations

### visualization/
Original visualization scripts:
- `comparision_indu_pre_vs_actual.py` - Historical comparison plots
- `indus_visual.py` - Target vs predicted visualization

## Why Archived?

These scripts were used to:
1. Experiment with different model architectures
2. Test various prediction approaches
3. Develop visualization prototypes

The final production versions incorporate the best elements from these experiments.
