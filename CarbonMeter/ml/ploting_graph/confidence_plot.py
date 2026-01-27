# ============================================================
# CarbonMeter - Calculated vs Predicted CO₂e Graph
# ============================================================
# estimated = 0 → calculated CO₂e (real user input)
# estimated = 1 → predicted CO₂e (ML)
# ============================================================

import pandas as pd
import matplotlib.pyplot as plt

# ------------------------------------------------------------
# 1. Load CSV
# ------------------------------------------------------------
CSV_PATH = "calculation_emission/carbonmeter_daily_log.csv"

df = pd.read_csv(CSV_PATH)

# Clean column names
df.columns = df.columns.str.strip().str.lower()

# Required columns check
required_cols = {"date", "total_co2", "estimated"}
missing = required_cols - set(df.columns)
if missing:
    raise ValueError(f"Missing required columns: {missing}")

# Parse date (DATE ONLY)
df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date
df = df.dropna(subset=["date"])

# Sort by date
df = df.sort_values("date")

# ------------------------------------------------------------
# 2. Split calculated vs predicted
# ------------------------------------------------------------
calculated_df = df[df["estimated"] == 0]
predicted_df  = df[df["estimated"] == 1]

if calculated_df.empty:
    raise ValueError("No calculated CO₂e data (estimated = 0) found.")

if predicted_df.empty:
    raise ValueError("No predicted CO₂e data (estimated = 1) found.")

# ------------------------------------------------------------
# 3. Plot graph
# ------------------------------------------------------------
plt.figure(figsize=(10, 5))

plt.plot(
    calculated_df["date"],
    calculated_df["total_co2"],
    label="Calculated CO₂e",
    marker="o"
)

plt.plot(
    predicted_df["date"],
    predicted_df["total_co2"],
    label="Predicted CO₂e",
    linestyle="--",
    marker="x"
)

plt.xlabel("Date")
plt.ylabel("CO₂ Emission (kg)")
plt.title("Calculated vs Predicted Daily CO₂ Emission")
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.show()
