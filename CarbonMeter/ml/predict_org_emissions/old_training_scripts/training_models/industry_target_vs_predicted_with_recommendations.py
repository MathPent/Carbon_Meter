import pandas as pd
import joblib
import matplotlib.pyplot as plt
import os

# --------------------------------------------------
# 1. Load model
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
growth_rate = 0.02
daily_growth = growth_rate / 7

# --------------------------------------------------
# 3. Target definition
# --------------------------------------------------
TARGET_CO2_DAILY = 40000
TARGET_REDUCTION = 0.001

records = []

# --------------------------------------------------
# 4. Recommendation Engine
# --------------------------------------------------
def generate_recommendations(row):
    recs = []

    if row["electricity_kwh"] > 14000:
        recs.append("Shift heavy loads to off-peak hours or use renewable power")

    if row["diesel_liter"] > 180:
        recs.append("Reduce diesel generator usage and optimize fuel logistics")

    if row["cement_ton"] > 11:
        recs.append("Optimize cement usage or reduce clinker ratio")

    if row["steel_ton"] > 7:
        recs.append("Increase recycled steel/scrap usage")

    if row["load_efficiency"] < 300:
        recs.append("Reduce machine idle time and improve scheduling")

    return " | ".join(recs) if recs else "Operations within optimal range"

# --------------------------------------------------
# 5. Prediction + Target + Recommendation
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

    predicted = model.predict(pd.DataFrame([future]))[0]
    target = TARGET_CO2_DAILY * (1 - TARGET_REDUCTION * day)

    status = "ABOVE TARGET" if predicted > target else "BELOW TARGET"

    recommendation = (
        generate_recommendations(future)
        if status == "ABOVE TARGET"
        else "No action required"
    )

    record = future.copy()
    record.update({
        "day_ahead": day,
        "predicted_co2_kg": round(predicted, 2),
        "target_co2_kg": round(target, 2),
        "gap_kg": round(predicted - target, 2),
        "status": status,
        "recommendations": recommendation
    })

    records.append(record)

# --------------------------------------------------
# 6. Save to CSV
# --------------------------------------------------
df_final = pd.DataFrame(records)
output_path = os.path.join(os.path.dirname(__file__), "..", "industry_target_vs_predicted_with_recommendations.csv")
df_final.to_csv(output_path, index=False)

print(f"✅ Saved: {output_path}")
print(df_final[[
    "day_ahead",
    "predicted_co2_kg",
    "target_co2_kg",
    "gap_kg",
    "status",
    "recommendations"
]].head())

# --------------------------------------------------
# 7. Visualization
# --------------------------------------------------
plt.figure(figsize=(11,5))
plt.plot(df_final["day_ahead"], df_final["predicted_co2_kg"], label="Predicted CO₂")
plt.plot(df_final["day_ahead"], df_final["target_co2_kg"], linestyle="--", label="Target CO₂")

plt.fill_between(
    df_final["day_ahead"],
    df_final["predicted_co2_kg"],
    df_final["target_co2_kg"],
    where=df_final["predicted_co2_kg"] > df_final["target_co2_kg"],
    alpha=0.3,
    label="Excess Emissions"
)

plt.xlabel("Days Ahead")
plt.ylabel("CO₂ (kg)")
plt.title("Target vs Predicted CO₂ with Automatic Recommendations")
plt.legend()
plt.grid(True)
plt.tight_layout()
plt.show()
