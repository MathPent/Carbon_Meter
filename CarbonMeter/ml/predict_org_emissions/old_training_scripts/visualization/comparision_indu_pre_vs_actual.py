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
# 2. Base operational data
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
growth_rate = 0.02   # 2% weekly
daily_growth = growth_rate / 7

# --------------------------------------------------
# 3. Target Definition (Industry Policy)
# --------------------------------------------------
TARGET_CO2_DAILY = 40000     # kg CO2/day
TARGET_REDUCTION = 0.001     # 0.1% reduction per day

records = []

# --------------------------------------------------
# 4. Prediction + Target Comparison
# --------------------------------------------------
for day in range(1, future_days + 1):
    factor = 1 + daily_growth * day

    future = current.copy()
    for col in [
        "electricity_kwh", "diesel_liter", "natural_gas_m3",
        "cement_ton", "steel_ton", "plastic_kg", "production_units"
    ]:
        future[col] *= factor

    # Feature engineering
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

    df_future = pd.DataFrame([future])
    predicted = model.predict(df_future)[0]

    # Dynamic target (gradually reducing)
    target = TARGET_CO2_DAILY * (1 - TARGET_REDUCTION * day)

    record = future.copy()
    record["day_ahead"] = day
    record["predicted_co2_kg"] = round(predicted, 2)
    record["target_co2_kg"] = round(target, 2)
    record["gap_kg"] = round(predicted - target, 2)
    record["status"] = "ABOVE TARGET" if predicted > target else "BELOW TARGET"

    records.append(record)

# --------------------------------------------------
# 5. Save comparison to CSV
# --------------------------------------------------
df_compare = pd.DataFrame(records)
df_compare.to_csv(
    "industry_target_vs_predicted_30days.csv",
    index=False
)

print("✅ Target vs Predicted comparison saved")
print(df_compare[[
    "day_ahead",
    "predicted_co2_kg",
    "target_co2_kg",
    "gap_kg",
    "status"
]].head())

# --------------------------------------------------
# 6. Visualization (Dashboard Graph)
# --------------------------------------------------
plt.figure(figsize=(11,5))
plt.plot(
    df_compare["day_ahead"],
    df_compare["predicted_co2_kg"],
    label="Predicted CO₂",
    linewidth=2
)
plt.plot(
    df_compare["day_ahead"],
    df_compare["target_co2_kg"],
    label="Target CO₂",
    linestyle="--",
    linewidth=2
)

plt.fill_between(
    df_compare["day_ahead"],
    df_compare["predicted_co2_kg"],
    df_compare["target_co2_kg"],
    where=df_compare["predicted_co2_kg"] > df_compare["target_co2_kg"],
    alpha=0.3,
    label="Excess Emissions"
)

plt.xlabel("Days Ahead")
plt.ylabel("CO₂ (kg)")
plt.title("Target vs Predicted Carbon Emissions (Manufacturing)")
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.show()
