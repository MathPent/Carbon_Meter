# 🌍 Industry Carbon Emission Prediction Pipeline

**AI-powered 30/180-day CO2 emission forecasting system using XGBoost**

---

## 🚀 Quick Start

### **One Command - Complete Demo**
```bash
python quick_start.py
```
This automatically:
- ✅ Generates input template
- ✅ Creates 30-day forecast
- ✅ Creates 180-day forecast  
- ✅ Generates comparison graphs
- ✅ Creates analysis dashboard

### **View All Results**
```bash
python view_all_content.py
```

---

## 📋 What This Does

This pipeline predicts future industrial carbon emissions using historical data:

- **Input:** 30 days of historical emission data (CSV)
- **Output:** 
  - 30 or 180-day future predictions (CSV files in `predictions/`)
  - Professional visualizations (PNG files in `representation/`)
- **Model:** Pre-trained XGBoost (industry_xgboost_final.pkl)

---

## 🎯 Usage

### **Option 1: Use Sample Data (Recommended for First Run)**
```bash
# Generate sample template
python generate_input_template.py

# Run predictions
python predict_future_emissions.py --days 30
python predict_future_emissions.py --days 180

# Create visualizations
python visualize_predictions.py --dashboard
```

### **Option 2: Use Your Own Data**
```bash
# 1. Prepare your CSV file with 30 rows and these columns:
# energy_consumed_kwh, fuel_consumption_liters, production_volume_units,
# material_input_kg, operating_hours, load_factor_percent, co2_emissions_kg

# 2. Run prediction
python predict_future_emissions.py --input your_data.csv --days 30

# 3. Visualize
python visualize_predictions.py
```

---

## 📁 Project Structure

```
industry_model/
├── 📊 Core Scripts
│   ├── predict_future_emissions.py      # Main prediction engine
│   ├── visualize_predictions.py         # Graph generator
│   ├── generate_input_template.py       # Sample data creator
│   ├── quick_start.py                   # One-click demo
│   └── view_all_content.py              # Content viewer
│
├── 📈 Outputs
│   ├── predictions/                     # CSV forecast files
│   └── representation/                  # PNG visualization files
│
├── 🤖 Model & Data
│   ├── industry_xgboost_final.pkl       # Pre-trained model (4.2 MB)
│   └── data/
│       └── industry_emission_10k.csv    # Training data (10,000 rows)
│
├── 📚 Documentation
│   ├── README.md                        # This file
│   └── COMMANDS.md                      # Command reference
│
└── 📦 Archive
    └── old_training_scripts/            # Historical training code
```

---

## 📊 Output Files

### **Predictions (CSV)**
Located in `predictions/` folder:
- `predicted_emissions_30days_YYYYMMDD_HHMMSS.csv` - 30-day forecast
- `predicted_emissions_180days_YYYYMMDD_HHMMSS.csv` - 180-day forecast

**Columns:**
- `day_ahead` - Days into future (1-30 or 1-180)
- `predicted_co2_kg` - Predicted CO2 emissions
- `energy_consumed_kwh`, `fuel_consumption_liters`, etc. - Feature values
- `estimated` - Flag: 0=historical, 1=predicted

### **Visualizations (PNG)**
Located in `representation/` folder:
- `historical_vs_predicted_*.png` - Comparison graph (300 DPI)
- `emission_analysis_dashboard_*.png` - Statistical dashboard (300 DPI)

To view: `explorer predictions\` or `explorer representation\`

---

## 🔧 Requirements

```bash
# Python 3.10+
pip install xgboost pandas numpy matplotlib scikit-learn joblib
```

Or use: `pip install -r requirements.txt` (from root directory)

---

## ⚙️ How It Works

1. **Input Validation:** Checks 30-day CSV has required 7 features
2. **Feature Engineering:** Adds physics-based features (energy_intensity, fuel_intensity, etc.)
3. **Model Loading:** Loads pre-trained XGBoost model
4. **Recursive Prediction:** 
   - Predicts day 31 using days 1-30
   - Predicts day 32 using days 2-31
   - Continues for 30 or 180 days
5. **Growth Modeling:** Applies 2% weekly growth (configurable)
6. **Output Generation:** Saves CSV + creates visualizations

---

## 🎨 Visualization Features

### **Comparison Graph**
- Historical data (blue)
- Predicted data (red, dashed)
- Transition point marked
- 300 DPI quality

### **Analysis Dashboard** (4 panels)
- CO2 trend over time
- Feature correlation heatmap
- Distribution histogram
- Statistics table

---

## 📝 Input CSV Format

Your CSV must have **exactly 30 rows** with these columns:

| Column | Description | Unit |
|--------|-------------|------|
| `energy_consumed_kwh` | Energy used | kWh |
| `fuel_consumption_liters` | Fuel burned | Liters |
| `production_volume_units` | Items produced | Units |
| `material_input_kg` | Raw materials | kg |
| `operating_hours` | Machine runtime | Hours |
| `load_factor_percent` | Capacity utilization | % (0-100) |
| `co2_emissions_kg` | Actual emissions | kg CO2 |

**Example:**
```csv
energy_consumed_kwh,fuel_consumption_liters,production_volume_units,material_input_kg,operating_hours,load_factor_percent,co2_emissions_kg
12500,450,1200,8500,18,75.5,3250.75
12800,460,1250,8700,19,78.2,3310.50
...
```

Generate template: `python generate_input_template.py`

---

## 🛠️ Command Reference

### **Generate & Predict**
```bash
python generate_input_template.py              # Create sample data
python predict_future_emissions.py --days 30   # 30-day forecast
python predict_future_emissions.py --days 180  # 180-day forecast
```

### **Visualize**
```bash
python visualize_predictions.py                # Comparison graph only
python visualize_predictions.py --dashboard    # Full dashboard
```

### **View Results**
```bash
python view_all_content.py                     # Show all content
explorer predictions\                          # Open predictions folder
explorer representation\                       # Open visualizations folder
```

### **Custom Input**
```bash
python predict_future_emissions.py --input your_file.csv --days 30 --growth 0.03
```

**Parameters:**
- `--input` - Path to your 30-day CSV (default: uses sample template)
- `--days` - Forecast duration: 30 or 180 (default: 30)
- `--growth` - Weekly growth rate (default: 0.02 = 2%)

---

## ✅ Verification

After running, check:
```bash
dir predictions\*.csv          # Should see CSV files
dir representation\*.png       # Should see PNG files
python view_all_content.py     # View complete summary
```

**Expected outputs:**
- ✅ 2+ CSV files in predictions/
- ✅ 2+ PNG files in representation/
- ✅ Console shows "SUCCESS" messages

---

## 🐛 Troubleshooting

### **Error: "Model file not found"**
```bash
# Verify model exists
dir industry_xgboost_final.pkl
# Should show: industry_xgboost_final.pkl (4+ MB)
```

### **Error: "Input file must have exactly 30 rows"**
```bash
# Generate correct template
python generate_input_template.py
# Use it: python predict_future_emissions.py
```

### **Error: "No prediction files found"**
```bash
# Run predictions first
python predict_future_emissions.py --days 30
# Then visualize
python visualize_predictions.py
```

### **Graphs not opening?**
```bash
# Windows: Open folder manually
explorer representation\
# Or: start representation\historical_vs_predicted_*.png
```

---

## 📊 Example Workflow

**Complete first-time run:**
```bash
# Step 1: Generate sample data
python generate_input_template.py

# Step 2: Run 30-day prediction
python predict_future_emissions.py --days 30

# Step 3: Create visualizations
python visualize_predictions.py --dashboard

# Step 4: View results
python view_all_content.py
explorer representation\
```

**Or just:**
```bash
python quick_start.py && python view_all_content.py
```

---

## 🎓 For Developers

### **Key Files:**
- **predict_future_emissions.py** (420 lines)
  - `IndustryEmissionPredictor` class
  - Methods: `validate_input_data()`, `engineer_features()`, `predict_next_days()`
  
- **visualize_predictions.py** (378 lines)
  - `EmissionVisualizer` class
  - Methods: `plot_comparison()`, `plot_statistical_summary()`

### **Model Details:**
- Algorithm: XGBoost Regressor
- Training data: 10,000 industrial records
- Features: 7 raw + 4 engineered = 11 total
- Performance: Optimized for industrial CO2 prediction

### **Extend Functionality:**
Modify these in the scripts:
- Growth rate: `--growth` parameter
- Visualization style: Edit `visualize_predictions.py`
- Feature engineering: Edit `engineer_features()` method

---

## 📞 Support

**Quick help:**
```bash
python predict_future_emissions.py --help
python visualize_predictions.py --help
```

**Check documentation:**
- Full commands: [COMMANDS.md](COMMANDS.md)
- This guide: [README.md](README.md)

---

## ✨ Features

✅ Recursive multi-day forecasting (30/180 days)  
✅ Physics-aware feature engineering  
✅ Configurable growth modeling  
✅ Professional 300 DPI visualizations  
✅ Automatic output organization  
✅ Estimated flag for predictions vs actuals  
✅ One-click demo mode  
✅ CSV + PNG exports  
✅ Comprehensive error handling  

---

**Ready to start?** Run: `python quick_start.py`

---

*Last Updated: January 2026 | Python 3.10+ | XGBoost Powered*
