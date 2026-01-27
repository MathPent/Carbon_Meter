# ============================================================
# CarbonMeter - Model Training with 70-10-20 Split
# ============================================================

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
import joblib

# ------------------------------------------------------------
# 1. Load Dataset
# ------------------------------------------------------------
df = pd.read_csv("training_data/individual_carbon_emissions_india.csv")

print("Dataset loaded successfully")
print("Total rows:", len(df))

# ------------------------------------------------------------
# 2. Separate Features and Target
# ------------------------------------------------------------
X = df.drop(columns=["monthly_co2_emission_kg", "user_id"])
y = df["monthly_co2_emission_kg"]

# ------------------------------------------------------------
# 3. Encode Categorical Features
# ------------------------------------------------------------
categorical_cols = X.select_dtypes(include="object").columns
X_encoded = pd.get_dummies(X, columns=categorical_cols, drop_first=True)

print("Feature encoding completed")
print("Total features:", X_encoded.shape[1])

# ------------------------------------------------------------
# 4. First Split: Train (70%) + Temp (30%)
# ------------------------------------------------------------
X_train, X_temp, y_train, y_temp = train_test_split(
    X_encoded,
    y,
    test_size=0.30,
    random_state=42
)

# ------------------------------------------------------------
# 5. Second Split: Validation (10%) + Test (20%)
# Temp is 30% → split into 1/3 val, 2/3 test
# ------------------------------------------------------------
X_val, X_test, y_val, y_test = train_test_split(
    X_temp,
    y_temp,
    test_size=2/3,
    random_state=42
)

print("\nData split completed:")
print("Training set:", X_train.shape)
print("Validation set:", X_val.shape)
print("Testing set:", X_test.shape)

# ------------------------------------------------------------
# 6. Initialize XGBoost Model
# ------------------------------------------------------------
model = XGBRegressor(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=5,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)

# ------------------------------------------------------------
# 7. Train Model using Validation Set
# ------------------------------------------------------------
model.fit(
    X_train,
    y_train,
    eval_set=[(X_val, y_val)],
    verbose=False
)

print("\nModel training completed")

# ------------------------------------------------------------
# 8. Evaluate on Test Set
# ------------------------------------------------------------
y_pred = model.predict(X_test)

mae = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print("\nModel Evaluation on Test Set")
print(f"MAE  : {mae:.2f} kg CO₂")
print(f"RMSE : {rmse:.2f} kg CO₂")
print(f"R²   : {r2:.4f}")

# ------------------------------------------------------------
# 9. Save Trained Model
# ------------------------------------------------------------
joblib.dump(model, "carbonmeter_behavioral_model.pkl")
print("\nModel saved as carbonmeter_behavioral_model.pkl")


# ----------------------------
# Model Training
# ----------------------------
model.fit(X_train, y_train)
print("Model training completed")


# ============================
# 🔹 VALIDATION STEP (ADD HERE)
# ============================
y_val_pred = model.predict(X_val)

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

val_mae = mean_absolute_error(y_val, y_val_pred)
val_rmse = np.sqrt(mean_squared_error(y_val, y_val_pred))
val_r2 = r2_score(y_val, y_val_pred)

print("\nModel Evaluation on Validation Set")
print(f"MAE  : {val_mae:.2f} kg CO₂")
print(f"RMSE : {val_rmse:.2f} kg CO₂")
print(f"R²   : {val_r2:.4f}")


# ============================
# 🔹 TEST STEP (ALREADY EXISTS)
# ============================
y_test_pred = model.predict(X_test)

test_mae = mean_absolute_error(y_test, y_test_pred)
test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
test_r2 = r2_score(y_test, y_test_pred)

print("\nModel Evaluation on Test Set")
print(f"MAE  : {test_mae:.2f} kg CO₂")
print(f"RMSE : {test_rmse:.2f} kg CO₂")
print(f"R²   : {test_r2:.4f}")


