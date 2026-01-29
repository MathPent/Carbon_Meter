# ============================================================
# CarbonMeter - Predict Missing Day from Daily Log (FINAL SAFE)
# - Handles timestamps like "2026-01-25 00:00:00"
# - Uses trained behavioral ML model
# - Predicts ONLY next missing day
# - Updates carbonmeter_daily_log.csv
# ============================================================

import pandas as pd
import joblib
import calendar
from datetime import timedelta

# ------------------------------------------------------------
# Paths
# ------------------------------------------------------------
MODEL_PATH = "carbonmeter_behavioral_model.pkl"
CSV_PATH = "calculation_emission/carbonmeter_daily_log.csv"

# ------------------------------------------------------------
# 1. Load ML model
# ------------------------------------------------------------
model = joblib.load(MODEL_PATH)
print("✅ Behavioral ML model loaded")

# ------------------------------------------------------------
# ------------------------------------------------------------
# Load daily carbon log (DATE ONLY FIX)
# ------------------------------------------------------------
# First, check if CSV has the right number of columns
with open(CSV_PATH, 'r') as f:
    header_line = f.readline().strip()
    first_data_line = f.readline().strip()
    header_count = len(header_line.split(','))
    data_count = len(first_data_line.split(','))
    
    # If data has more columns than header, we need to fix it
    if data_count > header_count:
        print(f"⚠️  CSV header mismatch: {header_count} headers but {data_count} data columns")
        print("   Adding missing 'estimated' column to header...")

try:
    daily_df = pd.read_csv(CSV_PATH)
except Exception as e:
    print(f"❌ Error reading CSV: {e}")
    # Try reading with manual column names
    expected_cols = ['date', 'transport_mode', 'public_transport_ratio', 
                     'transport_co2', 'electricity_co2', 'cooking_co2', 
                     'food_co2', 'waste_co2', 'digital_co2', 
                     'avoided_co2', 'total_co2', 'estimated']
    daily_df = pd.read_csv(CSV_PATH, names=expected_cols, skiprows=1)
    print("✅ CSV loaded with manual column names")

# Clean column names
daily_df.columns = daily_df.columns.str.strip().str.lower().str.replace('"', '')

# Add estimated column if it doesn't exist, and fill NaN with 0
if "estimated" not in daily_df.columns:
    print("⚠️  'estimated' column missing, adding with default value 0")
    daily_df["estimated"] = 0
else:
    # Fill missing estimated values with 0 (assuming they're real user entries)
    daily_df["estimated"] = daily_df["estimated"].fillna(0).astype(int)

# Convert to datetime first
daily_df["date"] = pd.to_datetime(
    daily_df["date"],
    format="mixed",
    errors="coerce"
)

# Drop invalid dates
daily_df = daily_df.dropna(subset=["date"])

# KEEP ONLY DATE (remove time permanently)
daily_df["date"] = daily_df["date"].dt.strftime("%Y-%m-%d")

# Convert back to datetime.date for calculations
daily_df["date"] = pd.to_datetime(daily_df["date"]).dt.date

daily_df = daily_df.sort_values("date")

print("📊 Daily carbon log loaded with DATE-ONLY format")

# ------------------------------------------------------------
# 3. Use only REAL user-entered rows
# ------------------------------------------------------------
# Keep all valid dates (for duplicate checking and final append)
valid_dates_df = daily_df.copy()

# Filter to only REAL user-entered rows for predictions
real_df = valid_dates_df[
    (valid_dates_df["estimated"] == 0) | (valid_dates_df["estimated"].isna())
]

if real_df.empty:
    print("\n⚠️  Debug Info:")
    print(f"Total rows in CSV: {len(valid_dates_df)}")
    print(f"Estimated column values:\n{valid_dates_df['estimated'].value_counts(dropna=False)}")
    print(f"\nAll dates in CSV:")
    print(valid_dates_df[['date', 'estimated']].tail(10))
    raise ValueError("❌ No real user-entered data found. All rows are marked as estimated=1")

last_real_date = real_df["date"].max()
missing_date = last_real_date + timedelta(days=1)

print(f"📅 Predicting missing date: {missing_date}")

# Prevent duplicate prediction
if ((valid_dates_df["date"] == missing_date) &
    (valid_dates_df["estimated"] == 1)).any():
    print("⚠️ Prediction already exists for this date. Exiting.")
    exit()

# ------------------------------------------------------------
# 4. Reconstruct ML features from last 7 real days
# ------------------------------------------------------------
recent = real_df.tail(7)

monthly_electricity_kwh = (recent["electricity_co2"].sum() / 0.82) * 30
fuel_consumption_liters = (recent["transport_co2"].sum() / 2.3) * 30
monthly_travel_km = recent["transport_co2"].sum() * 15
lpg_cylinders_per_month = recent["cooking_co2"].sum() / (14.2 * 3.0)

avg_public_ratio = recent["public_transport_ratio"].mean()

# Fuel encoding (must match training)
fuel_type_Petrol, fuel_type_Public = 1, 0
if avg_public_ratio > 0.6:
    fuel_type_Petrol, fuel_type_Public = 0, 1
elif 0 < avg_public_ratio <= 0.6:
    fuel_type_Petrol, fuel_type_Public = 1, 1

X = pd.DataFrame([{
    "monthly_electricity_kwh": monthly_electricity_kwh,
    "fuel_consumption_liters": fuel_consumption_liters,
    "monthly_travel_km": monthly_travel_km,
    "public_transport_ratio": avg_public_ratio,
    "lpg_cylinders_per_month": lpg_cylinders_per_month,
    "induction_usage_hours": 10,
    "solar_water_heater": 1,
    "household_size": 4,
    "online_orders_per_month": 4,
    "waste_recycling": 1,
    "fuel_type_Petrol": fuel_type_Petrol,
    "fuel_type_Public": fuel_type_Public
}])

# Align features EXACTLY with model
X = X[model.get_booster().feature_names]

# ------------------------------------------------------------
# 5. Predict MONTHLY → DAILY CO2
# ------------------------------------------------------------
predicted_monthly_co2 = model.predict(X)[0]

days_in_month = calendar.monthrange(
    missing_date.year, missing_date.month
)[1]

predicted_daily_co2 = round(predicted_monthly_co2 / days_in_month, 2)

# ------------------------------------------------------------
# 6. Sector-wise distribution (keeps CSV consistent)
# ------------------------------------------------------------
sector_cols = [
    "transport_co2",
    "electricity_co2",
    "cooking_co2",
    "food_co2",
    "waste_co2",
    "digital_co2",
    "avoided_co2"
]

sector_mean = recent[sector_cols].mean()
sector_ratio = sector_mean / sector_mean.sum()
predicted_sectors = (sector_ratio * predicted_daily_co2).round(2)

# Transport mode label
transport_mode = (
    "Private" if avg_public_ratio == 0
    else "Public" if avg_public_ratio == 1
    else "Mixed"
)

# ------------------------------------------------------------
# 7. Create predicted row
# ------------------------------------------------------------
predicted_row = {
    "date": missing_date,
    "transport_mode": transport_mode,
    "public_transport_ratio": round(avg_public_ratio, 2),
    "transport_co2": predicted_sectors["transport_co2"],
    "electricity_co2": predicted_sectors["electricity_co2"],
    "cooking_co2": predicted_sectors["cooking_co2"],
    "food_co2": predicted_sectors["food_co2"],
    "waste_co2": predicted_sectors["waste_co2"],
    "digital_co2": predicted_sectors["digital_co2"],
    "avoided_co2": predicted_sectors["avoided_co2"],
    "total_co2": predicted_daily_co2,
    "estimated": 1
}

# ------------------------------------------------------------
# 8. Append & save
# ------------------------------------------------------------
final_df = pd.concat(
    [valid_dates_df, pd.DataFrame([predicted_row])],
    ignore_index=True
)

final_df.to_csv(CSV_PATH, index=False)

# ------------------------------------------------------------
# 9. Output
# ------------------------------------------------------------
print("\n🌍 Missing Day Prediction Completed")
print("----------------------------------")
print(f"📅 Date      : {missing_date}")
print(f"🔥 CO₂ Total : {predicted_daily_co2} kg")
print("✅ CSV updated successfully")
print("Flag: estimated = 1")
