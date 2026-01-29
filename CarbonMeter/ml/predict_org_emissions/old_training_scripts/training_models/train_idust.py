import pandas as pd
import joblib
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import os

# Load dataset
csv_path = os.path.join(os.path.dirname(__file__), "..", "industry_emission_10k.csv")
df = pd.read_csv(csv_path)

X = df.drop(columns=["date", "co2_emission"])
y = df["co2_emission"]

# Train / Validation / Test split
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.30, random_state=42
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=42
)

model = XGBRegressor(
    n_estimators=400,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)

model.fit(X_train, y_train)

# Validation
val_pred = model.predict(X_val)
print("Validation MAE:", mean_absolute_error(y_val, val_pred))

# Testing
test_pred = model.predict(X_test)
print("Test MAE:", mean_absolute_error(y_test, test_pred))
print("Test R2 Score:", r2_score(y_test, test_pred))

model_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "industry_carbon_model.pkl")
joblib.dump(model, model_path)
print(f"✅ Industry carbon prediction model saved to {model_path}")
