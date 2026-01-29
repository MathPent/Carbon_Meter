# 🚀 QUICK COMMAND REFERENCE
## All Commands to Show Complete Content

---

## 1️⃣ **ONE-CLICK VIEW EVERYTHING**
```bash
python view_all_content.py
```
Shows all predictions, visualizations, statistics, and documentation in one go.

---

## 2️⃣ **RUN COMPLETE DEMO**
```bash
python quick_start.py
```
Generates new predictions + visualizations automatically.

---

## 3️⃣ **INDIVIDUAL COMMANDS**

### Generate Predictions
```bash
# 30-day forecast
python predict_future_emissions.py --days 30

# 180-day forecast
python predict_future_emissions.py --days 180
```

### Create Visualizations
```bash
# Comparison graph only
python visualize_predictions.py

# Full dashboard
python visualize_predictions.py --dashboard
```

### Generate Input Template
```bash
python generate_input_template.py
```

---

## 4️⃣ **VIEW OUTPUTS**

### View CSV Predictions
```bash
# Windows - Open in Excel
explorer predictions\

# View in terminal (latest file)
python -c "import pandas as pd; import glob; f=max(glob.glob('predictions/*.csv')); print(f'\nFile: '+f+'\n'); df=pd.read_csv(f); print(df.head(10))"
```

### View PNG Visualizations
```bash
# Windows - Open folder
explorer representation\

# Open latest PNG directly
python -c "import glob, os; f=max(glob.glob('representation/*.png')); os.startfile(f)"
```

### Read Documentation
```bash
# Start with overview
type INDEX.md

# User guide
type README_PREDICTION_PIPELINE.md

# All markdown files
dir *.md
```

---

## 5️⃣ **CHECK STATUS**

### Verify Files Exist
```bash
dir predictions\*.csv
dir representation\*.png
dir *.md
```

### Count Outputs
```bash
# PowerShell
(Get-ChildItem predictions\*.csv).Count
(Get-ChildItem representation\*.png).Count
```

---

## 6️⃣ **FOR JUDGES/DEMONSTRATION**

### Full Demo Sequence
```bash
# 1. Show template
python generate_input_template.py

# 2. Generate 30-day predictions
python predict_future_emissions.py --days 30

# 3. Generate 180-day predictions  
python predict_future_emissions.py --days 180

# 4. Create visualizations
python visualize_predictions.py --dashboard

# 5. View everything
python view_all_content.py

# 6. Open graphs
explorer representation\
```

### Quick Stats
```bash
python -c "import os; print('Predictions:', len([f for f in os.listdir('predictions') if f.endswith('.csv')])); print('Visualizations:', len([f for f in os.listdir('representation') if f.endswith('.png')]))"
```

---

## 📋 **WHAT EACH SCRIPT DOES**

| Script | Purpose | Output |
|--------|---------|--------|
| `quick_start.py` | One-click complete demo | All outputs |
| `predict_future_emissions.py` | Generate forecasts | CSV files |
| `visualize_predictions.py` | Create graphs | PNG files |
| `view_all_content.py` | Display all content | Terminal summary |
| `generate_input_template.py` | Create sample input | Template CSV |

---

## ✅ **EXPECTED OUTPUTS**

After running commands, you should have:
- ✅ `predictions/*.csv` - Forecast data (30/180 days)
- ✅ `representation/*.png` - Graphs and dashboards
- ✅ `sample_30day_input_template.csv` - Input example
- ✅ `INDEX.md`, `README_PREDICTION_PIPELINE.md`, etc. - Documentation

---

## 🎯 **RECOMMENDED FOR FIRST-TIME**

```bash
# Single command to generate everything and view
python quick_start.py && python view_all_content.py
```

This will:
1. ✅ Create template
2. ✅ Generate 30-day predictions
3. ✅ Generate 180-day predictions
4. ✅ Create comparison graph
5. ✅ Create analysis dashboard
6. ✅ Display all content summary

---

**Need help?** Run: `python [script_name].py --help`
