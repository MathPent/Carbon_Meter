import pandas as pd
import joblib
import matplotlib.pyplot as plt
import os

# ============================================================
# 1. LOAD MODEL & DATA
# ============================================================
BASE_DIR = os.path.dirname(__file__)

model_path = os.path.join(BASE_DIR, "..", "..", "..", "industry_xgboost_final.pkl")
csv_path = os.path.join(BASE_DIR, "..", "industry_emission_10k.csv")

if not os.path.exists(model_path):
    print(f"ERROR: Model file not found at {model_path}")
    print("Please run new_XGboost.py first to train the model.")
    exit(1)

model = joblib.load(model_path)
df = pd.read_csv(csv_path)

# ============================================================
# 2. FEATURE ENGINEERING (MUST MATCH TRAINING)
# ============================================================
df["energy_intensity"] = df["electricity_kwh"] / df["production_units"]
df["fuel_intensity"] = (df["diesel_liter"] + df["natural_gas_m3"]) / df["operating_hours"]
df["material_intensity"] = (
    df["cement_ton"] +
    df["steel_ton"] +
    (df["plastic_kg"] / 1000)
) / df["production_units"]
df["load_efficiency"] = df["production_units"] / df["operating_hours"]

df["date"] = pd.to_datetime(df["date"])

X = df.drop(columns=["date", "co2_emission"])
y = df["co2_emission"]

# ============================================================
# 3. HISTORICAL PREDICTION (MODEL FIT QUALITY)
# ============================================================
df["predicted_co2"] = model.predict(X)

# Select recent window for clarity (last 200 days)
history = df.tail(200)

plt.figure(figsize=(13,5))
plt.plot(history["date"], history["co2_emission"], label="Actual CO₂", linewidth=2)
plt.plot(history["date"], history["predicted_co2"], label="Predicted CO₂", linestyle="--")
plt.xlabel("Date")
plt.ylabel("CO₂ Emission (kg)")
plt.title("Actual vs Predicted CO₂ Emissions (Manufacturing Industry)")
plt.legend()
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# ============================================================
# 4. MODEL EXPLAINABILITY – FEATURE IMPORTANCE
# ============================================================
importance = model.feature_importances_
features = X.columns

plt.figure(figsize=(8,6))
plt.barh(features, importance)
plt.xlabel("Importance Score")
plt.title("Key Drivers of Industrial CO₂ Emissions")
plt.tight_layout()
plt.show()

# ============================================================
# 5. EMISSION SOURCE BREAKDOWN (ONE DAY – BUSINESS VIEW)
# ============================================================
sample = df.iloc[-1]  # most recent day

sources = {
    "Electricity": sample["electricity_kwh"] * 0.82,
    "Diesel": sample["diesel_liter"] * 2.31,
    "Natural Gas": sample["natural_gas_m3"] * 1.9,
    "Materials": (
        sample["cement_ton"] * 900 +
        sample["steel_ton"] * 1800 +
        sample["plastic_kg"] * 2.5
    )
}

plt.figure(figsize=(6,6))
plt.pie(sources.values(), labels=sources.keys(), autopct="%1.1f%%", startangle=140)
plt.title("CO₂ Emission Source Breakdown (Latest Day)")
plt.show()

# ============================================================
# 6. 30-DAY FUTURE EMISSION FORECAST (SCENARIO-BASED)
# ============================================================
last_row = df.iloc[-1].copy()

future_days = 30
growth_rate_daily = 0.0028  # ~2% weekly growth
future_predictions = []

for day in range(1, future_days + 1):
    factor = 1 + growth_rate_daily * day

    future = last_row.copy()
    for col in [
        "electricity_kwh", "diesel_liter", "natural_gas_m3",
        "cement_ton", "steel_ton", "plastic_kg", "production_units"
    ]:
        future[col] *= factor

    # Recalculate engineered features
    future["energy_intensity"] = future["electricity_kwh"] / future["production_units"]
    future["fuel_intensity"] = (
        future["diesel_liter"] + future["natural_gas_m3"]
    ) / future["operating_hours"]
    future["material_intensity"] = (
        future["cement_ton"] +
        future["steel_ton"] +
        (future["plastic_kg"] / 1000)
    ) / future["production_units"]
    future["load_efficiency"] = future["production_units"] / future["operating_hours"]

    future_df = pd.DataFrame([future[X.columns]])
    future_predictions.append(model.predict(future_df)[0])

# Plot forecast
plt.figure(figsize=(10,4))
plt.plot(range(1, future_days + 1), future_predictions, marker="o")
plt.xlabel("Days Ahead")
plt.ylabel("Predicted CO₂ (kg)")
plt.title("30-Day Carbon Emission Forecast (Manufacturing Industry)")
plt.grid(True)
plt.tight_layout()
plt.show()
