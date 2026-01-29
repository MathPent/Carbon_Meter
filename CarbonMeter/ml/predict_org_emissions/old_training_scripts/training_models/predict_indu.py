import pandas as pd
import joblib
import matplotlib.pyplot as plt
import os

# --------------------------------------------------
# 1. Load trained model
# --------------------------------------------------
model_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "industry_xgboost_final.pkl")
if not os.path.exists(model_path):
    print(f"ERROR: Model file not found at {model_path}")
    print("Please run new_XGboost.py first to train the model.")
    exit(1)
model = joblib.load(model_path)

# --------------------------------------------------
# 2. Last known day data (base scenario)
# --------------------------------------------------
current = {
    "electricity_kwh": 15000,
    "diesel_liter": 200,
    "natural_gas_m3": 600,
    "cement_ton": 12,
    "steel_ton": 8,
    "plastic_kg": 350,
    "production_units": 4500,
    "operating_hours": 16,
    "capacity_utilization": 78
}

future_days = 30
growth_rate = 0.02  # 2% weekly ≈ 0.28% daily

records = []

# --------------------------------------------------
# 3. Generate future scenarios + predictions
# --------------------------------------------------
for day in range(1, future_days + 1):
    factor = 1 + (growth_rate / 7) * day

    future = current.copy()

    # Scale usage with growth
    future["electricity_kwh"] *= factor
    future["diesel_liter"] *= factor
    future["natural_gas_m3"] *= factor
    future["cement_ton"] *= factor
    future["steel_ton"] *= factor
    future["plastic_kg"] *= factor
    future["production_units"] *= factor

    # -----------------------------
    # Feature engineering
    # -----------------------------
    future["energy_intensity"] = future["electricity_kwh"] / future["production_units"]
    future["fuel_intensity"] = (
        future["diesel_liter"] + future["natural_gas_m3"]
    ) / future["operating_hours"]
    future["material_intensity"] = (
        future["cement_ton"] +
        future["steel_ton"] +
        future["plastic_kg"] / 1000
    ) / future["production_units"]
    future["load_efficiency"] = future["production_units"] / future["operating_hours"]

    # -----------------------------
    # Prediction
    # -----------------------------
    df_future = pd.DataFrame([future])
    co2_pred = model.predict(df_future)[0]

    # -----------------------------
    # Store record
    # -----------------------------
    record = future.copy()
    record["day_ahead"] = day
    record["predicted_co2_kg"] = round(co2_pred, 2)

    records.append(record)

# --------------------------------------------------
# 4. Save predictions to CSV
# --------------------------------------------------
forecast_df = pd.DataFrame(records)

forecast_df.to_csv(
    "industry_30_day_emission_forecast.csv",
    index=False
)

print("✅ Future emission predictions saved to industry_30_day_emission_forecast.csv")
print(forecast_df.head())

# --------------------------------------------------
# 5. Plot future emission trend
# --------------------------------------------------
plt.figure(figsize=(10,4))
plt.plot(
    forecast_df["day_ahead"],
    forecast_df["predicted_co2_kg"],
    marker="o"
)
plt.xlabel("Days Ahead")
plt.ylabel("Predicted CO₂ (kg)")
plt.title("30-Day Future Carbon Emission Forecast")
plt.grid(True)
plt.tight_layout()
plt.show()
