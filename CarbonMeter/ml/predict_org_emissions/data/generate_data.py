import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# -----------------------
# Emission Factors
# -----------------------
ELECTRICITY_EF = 0.82
DIESEL_EF = 2.31
NATURAL_GAS_EF = 1.90
CEMENT_EF = 900
STEEL_EF = 1800
PLASTIC_EF = 2.5

np.random.seed(42)

rows = 10000
start_date = datetime(2024, 1, 1)

data = []

for i in range(rows):
    date = start_date + timedelta(days=i)

    electricity = np.random.randint(8000, 20000)
    diesel = np.random.randint(50, 300)
    gas = np.random.randint(200, 800)

    cement = np.random.uniform(5, 20)
    steel = np.random.uniform(3, 15)
    plastic = np.random.uniform(100, 600)

    production = np.random.randint(2000, 6000)
    hours = np.random.randint(8, 24)
    capacity = np.random.uniform(40, 100)

    co2 = (
        electricity * ELECTRICITY_EF +
        diesel * DIESEL_EF +
        gas * NATURAL_GAS_EF +
        cement * CEMENT_EF +
        steel * STEEL_EF +
        plastic * PLASTIC_EF
    )

    data.append([
        date.strftime("%Y-%m-%d"),
        electricity,
        diesel,
        gas,
        round(cement, 2),
        round(steel, 2),
        round(plastic, 2),
        production,
        hours,
        round(capacity, 1),
        round(co2, 2)
    ])

columns = [
    "date",
    "electricity_kwh",
    "diesel_liter",
    "natural_gas_m3",
    "cement_ton",
    "steel_ton",
    "plastic_kg",
    "production_units",
    "operating_hours",
    "capacity_utilization",
    "co2_emission"
]

df = pd.DataFrame(data, columns=columns)

df.to_csv("industry_emission_10k.csv", index=False)

print("✅ 10,000-row industry dataset generated successfully")
