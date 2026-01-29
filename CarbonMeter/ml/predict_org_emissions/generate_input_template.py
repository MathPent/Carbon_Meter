"""
Generate sample 30-day historical input template for users.
This script creates a template CSV that users can fill with their own data.
"""

import pandas as pd
import os
from datetime import datetime, timedelta

# Base values (sample operational data)
base_data = {
    'electricity_kwh': 15000,
    'diesel_liter': 200,
    'natural_gas_m3': 600,
    'cement_ton': 12.0,
    'steel_ton': 8.0,
    'plastic_kg': 350.0,
    'production_units': 4500,
    'operating_hours': 16,
    'capacity_utilization': 78.0
}

# Generate 30 days with slight variations
records = []
start_date = datetime.now() - timedelta(days=30)

for day in range(30):
    record = base_data.copy()
    current_date = start_date + timedelta(days=day)
    record['date'] = current_date.strftime('%Y-%m-%d')
    
    # Add small random variations (±5%)
    import random
    random.seed(day)
    
    for key in base_data.keys():
        if key not in ['operating_hours']:  # Keep operating hours constant
            variation = random.uniform(-0.05, 0.05)
            record[key] = round(base_data[key] * (1 + variation), 2)
    
    records.append(record)

# Create DataFrame
df = pd.DataFrame(records)

# Reorder columns for better readability
column_order = [
    'date',
    'electricity_kwh',
    'diesel_liter',
    'natural_gas_m3',
    'cement_ton',
    'steel_ton',
    'plastic_kg',
    'production_units',
    'operating_hours',
    'capacity_utilization'
]

df = df[column_order]

# Save template
output_path = os.path.join(os.path.dirname(__file__), 'sample_30day_input_template.csv')
df.to_csv(output_path, index=False)

print(f"✅ Sample input template created: {output_path}")
print("\nColumn Descriptions:")
print("="*70)
print("date                   : Date in YYYY-MM-DD format (optional)")
print("electricity_kwh        : Daily electricity consumption in kWh")
print("diesel_liter          : Daily diesel fuel usage in liters")
print("natural_gas_m3        : Daily natural gas consumption in cubic meters")
print("cement_ton            : Daily cement usage in tons")
print("steel_ton             : Daily steel usage in tons")
print("plastic_kg            : Daily plastic material usage in kilograms")
print("production_units      : Number of units produced daily")
print("operating_hours       : Daily operating hours")
print("capacity_utilization  : Facility capacity utilization percentage")
print("="*70)
print("\n📝 Instructions:")
print("1. Replace the sample values with your actual 30-day operational data")
print("2. Ensure all numerical values are accurate")
print("3. Save the file and use it with predict_future_emissions.py")
print("\nExample usage:")
print(f"python predict_future_emissions.py --input {output_path} --days 30")
