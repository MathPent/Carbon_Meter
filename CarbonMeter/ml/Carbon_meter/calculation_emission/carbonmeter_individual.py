import csv
from datetime import datetime
import os

# ======================
# Emission Factors (India)
# ======================
GRID_EF = 0.82
PETROL_EF = 2.31
LPG_EF = 3.13

BUS_EF = 0.041
TRAIN_EF = 0.035
FLIGHT_EF = 0.15

DATA_EF = 0.06
ONLINE_ORDER_EF = 0.5

FOOD_EF = {
    "veg": 2.0,
    "non-veg": 5.0
}

# ======================
# Fixed CSV Location
# ======================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, "carbonmeter_daily_log.csv")

# ======================
# Transport Calculation
# ======================
def calculate_transport():
    print("\nPrivate Vehicle Type:")
    print("1. Bike")
    print("2. Car")
    private_choice = input("Select private vehicle (1/2): ")

    private_mode = "Bike" if private_choice == "1" else "Car"

    total_km = float(input("Total distance travelled today (km): "))
    public_ratio = float(input("Public transport ratio (0–1): "))

    public_mode = input("Public transport used (bus/train/flight): ").strip().lower()

    private_km = total_km * (1 - public_ratio)
    public_km = total_km * public_ratio

    fuel_liters = float(input("Fuel consumed by private vehicle (liters): "))
    private_emission = fuel_liters * PETROL_EF

    if public_mode == "bus":
        public_emission = public_km * BUS_EF
    elif public_mode == "train":
        public_emission = public_km * TRAIN_EF
    elif public_mode == "flight":
        public_emission = public_km * FLIGHT_EF
    else:
        public_emission = 0

    total_transport = private_emission + public_emission
    transport_meta = f"{private_mode}+{public_mode} ({public_ratio*100:.0f}% public)"

    return total_transport, transport_meta, public_ratio

# ======================
# Other Calculations
# ======================
def calculate_electricity():
    return float(input("Electricity used (kWh): ")) * GRID_EF

def calculate_cooking():
    lpg = float(input("LPG used (kg): "))
    induction = float(input("Induction usage (hours): "))
    return (lpg * LPG_EF) + (induction * 1.5 * GRID_EF)

def calculate_food():
    return FOOD_EF.get(input("Diet type (veg / non-veg): ").strip().lower(), 2.0)

def calculate_waste():
    return -0.2 if int(input("Waste recycled? (1=yes, 0=no): ")) == 1 else 0.0

def calculate_digital():
    data = float(input("Internet data used (GB): "))
    orders = int(input("Online orders today: "))
    return (data * DATA_EF) + (orders * ONLINE_ORDER_EF)

def calculate_avoided():
    avoided = 0
    if int(input("Solar water heater used? (1=yes, 0=no): ")) == 1:
        avoided += 1.5 * GRID_EF

    led = float(input("LED lighting percentage (0–100): "))
    avoided += (led / 100) * 0.8
    return avoided

# ======================
# CSV Update Logic
# ======================
def update_csv(row, date_today):
    header = [
        "date", "transport_mode", "public_transport_ratio",
        "transport_co2", "electricity_co2", "cooking_co2",
        "food_co2", "waste_co2", "digital_co2",
        "avoided_co2", "total_co2", "estimated"
    ]

    rows = []
    if os.path.exists(CSV_FILE):
        with open(CSV_FILE, "r", newline="") as f:
            rows = list(csv.reader(f))

    new_rows = [header]
    updated = False

    for r in rows[1:]:
        if r[0] == date_today:
            new_rows.append(row)
            updated = True
        else:
            new_rows.append(r)

    if not updated:
        new_rows.append(row)

    with open(CSV_FILE, "w", newline="") as f:
        csv.writer(f).writerows(new_rows)

# ======================
# Main Runner
# ======================
def run_carbonmeter():
    print("\n--- CarbonMeter : Daily Individual Emission ---\n")

    transport, transport_mode, public_ratio = calculate_transport()
    electricity = calculate_electricity()
    cooking = calculate_cooking()
    food = calculate_food()
    waste = calculate_waste()
    digital = calculate_digital()
    avoided = calculate_avoided()

    total = round(
        transport + electricity + cooking +
        food + waste + digital - avoided, 2
    )

    # 🔑 DATE CONTROL (FIXED)
    date_today = input("Enter date (YYYY-MM-DD) [Press Enter for today]: ").strip()
    if not date_today:
        date_today = datetime.now().strftime("%Y-%m-%d")

    row = [
        date_today,
        transport_mode,
        public_ratio,
        round(transport, 2),
        round(electricity, 2),
        round(cooking, 2),
        round(food, 2),
        round(waste, 2),
        round(digital, 2),
        round(avoided, 2),
        total,
        0
    ]

    update_csv(row, date_today)

    print("\n✅ CSV updated successfully")
    print(f"📅 Date: {date_today}")
    print(f"🔥 Total CO₂ today: {total} kg\n")

# ======================
# Entry Point
# ======================
if __name__ == "__main__":
    run_carbonmeter()
