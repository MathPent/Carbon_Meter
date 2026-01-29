# ============================================================
# CarbonMeter – Interactive Rule-Based Industry Carbon Calculator
# Manufacturing Industry | Monthly CO₂e Accounting
# ============================================================

import csv
import os
from datetime import datetime

# ============================================================
# 1. EMISSION FACTORS (India / IPCC-based)
# ============================================================
EF = {
    "electricity": 0.82,   # kg CO2 / kWh
    "diesel": 2.31,        # kg CO2 / liter
    "gas": 1.90,           # kg CO2 / m3
    "coal": 2.42,          # kg CO2 / kg
    "cement": 900,         # kg CO2 / ton
    "steel": 1800,         # kg CO2 / ton
    "plastic": 2.5         # kg CO2 / kg
}

CSV_FILE = "industry_monthly_carbon_log.csv"

# ============================================================
# 2. BASIC INDUSTRY DETAILS
# ============================================================
print("\n🏭 INDUSTRY CARBON EMISSION CALCULATOR (MONTHLY)\n")

industry = input("Enter Industry Name: ")
month = input("Enter Reporting Month (YYYY-MM): ")
date_logged = datetime.now().strftime("%Y-%m-%d")

# ============================================================
# 3. MACHINE-WISE INPUT
# ============================================================
machines = []
num_machines = int(input("\nEnter number of machines: "))

for i in range(num_machines):
    print(f"\n--- Machine {i+1} ---")
    machine = input("Machine Name: ")

    electricity = float(input("Electricity used (kWh/month): "))
    diesel = float(input("Diesel used (liters/month): "))
    gas = float(input("Natural Gas used (m3/month): "))
    coal = float(input("Coal used (kg/month): "))

    machines.append({
        "machine": machine,
        "electricity_kwh": electricity,
        "diesel_liter": diesel,
        "gas_m3": gas,
        "coal_kg": coal
    })

# ============================================================
# 4. PROCESS / MATERIAL INPUT
# ============================================================
print("\n--- Process / Material Usage (Monthly) ---")
cement_ton = float(input("Cement used (tons): "))
steel_ton = float(input("Steel used (tons): "))
plastic_kg = float(input("Plastic used (kg): "))

# ============================================================
# 5. CALCULATE EMISSIONS
# ============================================================
rows = []
total_machine_co2 = 0.0

for m in machines:
    co2 = (
        m["electricity_kwh"] * EF["electricity"]
        + m["diesel_liter"] * EF["diesel"]
        + m["gas_m3"] * EF["gas"]
        + m["coal_kg"] * EF["coal"]
    )
    total_machine_co2 += co2

    rows.append({
        "industry": industry,
        "month": month,
        "machine": m["machine"],
        "electricity_kwh": m["electricity_kwh"],
        "diesel_liter": m["diesel_liter"],
        "gas_m3": m["gas_m3"],
        "coal_kg": m["coal_kg"],
        "co2_kg": round(co2, 2),
        "type": "machine",
        "estimated": 0,
        "date_logged": date_logged
    })

# Process emissions
process_co2 = (
    cement_ton * EF["cement"]
    + steel_ton * EF["steel"]
    + plastic_kg * EF["plastic"]
)

rows.append({
    "industry": industry,
    "month": month,
    "machine": "PROCESS_EMISSIONS",
    "electricity_kwh": "",
    "diesel_liter": "",
    "gas_m3": "",
    "coal_kg": "",
    "co2_kg": round(process_co2, 2),
    "type": "process",
    "estimated": 0,
    "date_logged": date_logged
})

# Total emissions
total_co2 = total_machine_co2 + process_co2

rows.append({
    "industry": industry,
    "month": month,
    "machine": "TOTAL_MONTHLY_CO2",
    "electricity_kwh": "",
    "diesel_liter": "",
    "gas_m3": "",
    "coal_kg": "",
    "co2_kg": round(total_co2, 2),
    "type": "total",
    "estimated": 0,
    "date_logged": date_logged
})

# ============================================================
# 6. WRITE / APPEND TO CSV
# ============================================================
file_exists = os.path.isfile(CSV_FILE)

headers = [
    "industry",
    "month",
    "machine",
    "electricity_kwh",
    "diesel_liter",
    "gas_m3",
    "coal_kg",
    "co2_kg",
    "type",
    "estimated",
    "date_logged"
]

with open(CSV_FILE, mode="a", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=headers)

    if not file_exists:
        writer.writeheader()

    for row in rows:
        writer.writerow(row)

# ============================================================
# 7. SUMMARY OUTPUT
# ============================================================
print("\n📊 MONTHLY CARBON EMISSION SUMMARY")
print("=================================")

for r in rows:
    if r["type"] == "machine":
        print(f"{r['machine']}: {r['co2_kg']} kg CO₂")

print(f"\nProcess Emissions: {process_co2:.2f} kg CO₂")
print("---------------------------------")
print(f"TOTAL MONTHLY CO₂e: {total_co2:.2f} kg")

print(f"\n✅ Data saved to {CSV_FILE}")
print("ℹ estimated = 0 → calculated (rule-based)")
print("ℹ estimated = 1 → predicted (ML, future)")
