# ============================================================
# Industry Carbon Emission – Full Accuracy Pipeline (ONE FILE)
# ============================================================

import pandas as pd
import numpy as np
import joblib
import os

from xgboost import XGBRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, KFold
from sklearn.metrics import mean_absolute_error, r2_score

# ----------------------------
# 1. Load Dataset
# ----------------------------
csv_path = os.path.join(os.path.dirname(__file__), "..", "industry_emission_10k.csv")
df = pd.read_csv(csv_path)

# ----------------------------
# 2. Physics-Aware Feature Engineering
# ----------------------------
df["energy_intensity"] = df["electricity_kwh"] / df["production_units"]
df["fuel_intensity"] = (df["diesel_liter"] + df["natural_gas_m3"]) / df["operating_hours"]
df["material_intensity"] = (
    df["cement_ton"] +
    df["steel_ton"] +
    (df["plastic_kg"] / 1000)
) / df["production_units"]
df["load_efficiency"] = df["production_units"] / df["operating_hours"]

# ----------------------------
# 3. Add Controlled Noise (Realism)
# ----------------------------
np.random.seed(42)
noise = np.random.normal(
    0,
    0.05 * df["co2_emission"].std(),
    size=len(df)
)
df["co2_emission"] = df["co2_emission"] + noise

# ----------------------------
# 4. Prepare Features & Target
# ----------------------------
X = df.drop(columns=["date", "co2_emission"])
y = df["co2_emission"]

# ----------------------------
# 5. Train / Validation / Test Split
# ----------------------------
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.30, random_state=42
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=42
)

# ----------------------------
# 6. Improved XGBoost Model
# ----------------------------
xgb_model = XGBRegressor(
    n_estimators=700,
    learning_rate=0.03,
    max_depth=7,
    min_child_weight=3,
    subsample=0.85,
    colsample_bytree=0.85,
    reg_alpha=0.1,
    reg_lambda=1.5,
    random_state=42
)

xgb_model.fit(X_train, y_train)

# ----------------------------
# 7. Random Forest Model
# ----------------------------
rf_model = RandomForestRegressor(
    n_estimators=400,
    max_depth=20,
    random_state=42,
    n_jobs=-1
)

rf_model.fit(X_train, y_train)

# ----------------------------
# 8. Validation Performance
# ----------------------------
xgb_val_pred = xgb_model.predict(X_val)
rf_val_pred = rf_model.predict(X_val)

ensemble_val_pred = 0.7 * xgb_val_pred + 0.3 * rf_val_pred

print("\n📊 VALIDATION RESULTS")
print("XGBoost MAE:", mean_absolute_error(y_val, xgb_val_pred))
print("RandomForest MAE:", mean_absolute_error(y_val, rf_val_pred))
print("Ensemble MAE:", mean_absolute_error(y_val, ensemble_val_pred))

# ----------------------------
# 9. Test Performance
# ----------------------------
xgb_test_pred = xgb_model.predict(X_test)
rf_test_pred = rf_model.predict(X_test)

ensemble_test_pred = 0.7 * xgb_test_pred + 0.3 * rf_test_pred

print("\n📈 TEST RESULTS")
print("Ensemble MAE:", mean_absolute_error(y_test, ensemble_test_pred))
print("Ensemble R2 :", r2_score(y_test, ensemble_test_pred))

# ----------------------------
# 10. K-Fold Cross Validation
# ----------------------------
kf = KFold(n_splits=5, shuffle=True, random_state=42)
cv_mae = []

for train_idx, test_idx in kf.split(X):
    X_tr, X_te = X.iloc[train_idx], X.iloc[test_idx]
    y_tr, y_te = y.iloc[train_idx], y.iloc[test_idx]

    xgb_model.fit(X_tr, y_tr)
    rf_model.fit(X_tr, y_tr)

    pred = (
        0.7 * xgb_model.predict(X_te) +
        0.3 * rf_model.predict(X_te)
    )

    cv_mae.append(mean_absolute_error(y_te, pred))

print("\n🔁 CROSS-VALIDATION")
print("Average CV MAE:", np.mean(cv_mae))

# ----------------------------
# 11. Save Final Models
# ----------------------------
xgb_model_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "industry_xgb_model_final.pkl")
rf_model_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "industry_rf_model_final.pkl")

joblib.dump(xgb_model, xgb_model_path)
joblib.dump(rf_model, rf_model_path)

print("\n✅ FINAL INDUSTRY MODELS SAVED")
print(f"📁 XGBoost: {xgb_model_path}")
print(f"📁 RandomForest: {rf_model_path}")
