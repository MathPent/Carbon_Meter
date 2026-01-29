# ============================================================
# FINAL Industry Carbon Emission Model
# XGBoost + Explainability (ONE FILE)
# ============================================================

import pandas as pd
import numpy as np
import joblib
import os

from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split, KFold
from sklearn.metrics import mean_absolute_error, r2_score

# ------------------------------------------------------------
# 1. Load Dataset
# ------------------------------------------------------------
csv_path = os.path.join(os.path.dirname(__file__), "..", "industry_emission_10k.csv")
df = pd.read_csv(csv_path)

# ------------------------------------------------------------
# 2. Physics-Aware Feature Engineering
# ------------------------------------------------------------
df["energy_intensity"] = df["electricity_kwh"] / df["production_units"]
df["fuel_intensity"] = (df["diesel_liter"] + df["natural_gas_m3"]) / df["operating_hours"]
df["material_intensity"] = (
    df["cement_ton"] +
    df["steel_ton"] +
    (df["plastic_kg"] / 1000)
) / df["production_units"]
df["load_efficiency"] = df["production_units"] / df["operating_hours"]

# ------------------------------------------------------------
# 3. Add Realistic Noise (5%)
# ------------------------------------------------------------
np.random.seed(42)
noise = np.random.normal(
    0,
    0.05 * df["co2_emission"].std(),
    size=len(df)
)
df["co2_emission"] = df["co2_emission"] + noise

# ------------------------------------------------------------
# 4. Prepare Features & Target
# ------------------------------------------------------------
X = df.drop(columns=["date", "co2_emission"])
y = df["co2_emission"]

# ------------------------------------------------------------
# 5. Train / Validation / Test Split
# ------------------------------------------------------------
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.30, random_state=42
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=42
)

# ------------------------------------------------------------
# 6. FINAL XGBOOST MODEL (LOCKED)
# ------------------------------------------------------------
model = XGBRegressor(
    n_estimators=600,
    learning_rate=0.03,
    max_depth=7,
    min_child_weight=3,
    subsample=0.85,
    colsample_bytree=0.85,
    reg_alpha=0.1,
    reg_lambda=1.5,
    random_state=42
)

model.fit(X_train, y_train)

# ------------------------------------------------------------
# 7. Evaluation
# ------------------------------------------------------------
val_pred = model.predict(X_val)
test_pred = model.predict(X_test)

print("\n📊 VALIDATION RESULTS")
print("Validation MAE:", mean_absolute_error(y_val, val_pred))

print("\n📈 TEST RESULTS")
print("Test MAE:", mean_absolute_error(y_test, test_pred))
print("Test R2 :", r2_score(y_test, test_pred))

# ------------------------------------------------------------
# 8. Cross-Validation (Stability Check)
# ------------------------------------------------------------
kf = KFold(n_splits=5, shuffle=True, random_state=42)
cv_mae = []

for tr_idx, te_idx in kf.split(X):
    X_tr, X_te = X.iloc[tr_idx], X.iloc[te_idx]
    y_tr, y_te = y.iloc[tr_idx], y.iloc[te_idx]

    model.fit(X_tr, y_tr)
    pred = model.predict(X_te)
    cv_mae.append(mean_absolute_error(y_te, pred))

print("\n🔁 CROSS-VALIDATION")
print("Average CV MAE:", np.mean(cv_mae))

# ------------------------------------------------------------
# 9. GLOBAL EXPLAINABILITY (Feature Importance)
# ------------------------------------------------------------
importance = model.feature_importances_
features = X.columns

feature_importance_df = pd.DataFrame({
    "feature": features,
    "importance": importance
}).sort_values(by="importance", ascending=False)

print("\n🧠 GLOBAL FEATURE IMPORTANCE")
print(feature_importance_df)

# ------------------------------------------------------------
# 10. LOCAL EXPLAINABILITY (Per-Prediction Contribution)
# ------------------------------------------------------------
def explain_single_prediction(input_row, model, X_reference):
    """
    Approximates contribution of each feature
    using mean baseline comparison
    """
    baseline = X_reference.mean()
    contributions = {}

    base_pred = model.predict(pd.DataFrame([baseline]))[0]
    full_pred = model.predict(pd.DataFrame([input_row]))[0]

    for col in input_row.index:
        temp = baseline.copy()
        temp[col] = input_row[col]
        pred = model.predict(pd.DataFrame([temp]))[0]
        contributions[col] = pred - base_pred

    return full_pred, contributions


# Example explanation (first test sample)
sample_input = X_test.iloc[0]
pred_value, contribution = explain_single_prediction(
    sample_input, model, X_train
)

print("\n🔍 SAMPLE PREDICTION EXPLANATION")
print("Predicted CO₂:", round(pred_value, 2))
print("Top contributing factors:")

for k, v in sorted(contribution.items(), key=lambda x: abs(x[1]), reverse=True)[:5]:
    print(f"{k:25s} → {v:+.2f} kg")

# ------------------------------------------------------------
# 11. Save Final Model
# ------------------------------------------------------------
model_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "industry_xgboost_final.pkl")
joblib.dump(model, model_path)

print(f"\n✅ FINAL XGBOOST MODEL SAVED")
print(f"📁 Model saved to: {model_path}")
