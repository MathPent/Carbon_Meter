"""
Organization Emission Prediction API
Manufacturing Industry Focus (Cement, Steel, Power, Chemicals)

This Flask API exposes XGBoost model predictions for organization-level emissions.
Runs on http://localhost:8001
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import numpy as np
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5000"])

# Load XGBoost model
MODEL_PATH = "industry_xgboost_final.pkl"
RECOMMENDATIONS_PATH = "industry_target_vs_predicted_with_recommendations.csv"
PREDICTIONS_DIR = "predictions"
PREDICTIONS_CSV = os.path.join(PREDICTIONS_DIR, "industry_target_vs_predicted_with_recommendations.csv")
SAMPLE_TEMPLATE_PATH = "sample_30day_input_template.csv"

# Global model variable
model = None
recommendations_df = None
sample_data = None

def load_model():
    """Load XGBoost model and supporting data"""
    global model, recommendations_df, sample_data
    
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            print(f"✓ Loaded XGBoost model from {MODEL_PATH}")
        else:
            print(f"⚠ Model file not found: {MODEL_PATH}")
            model = None
        
        if os.path.exists(RECOMMENDATIONS_PATH):
            recommendations_df = pd.read_csv(RECOMMENDATIONS_PATH)
            print(f"✓ Loaded recommendations from {RECOMMENDATIONS_PATH}")
        else:
            print(f"⚠ Recommendations file not found")
            recommendations_df = None
        
        if os.path.exists(SAMPLE_TEMPLATE_PATH):
            sample_data = pd.read_csv(SAMPLE_TEMPLATE_PATH)
            print(f"✓ Loaded sample data template")
        else:
            print(f"⚠ Sample template not found")
            sample_data = None
            
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        model = None

# Load on startup
load_model()

# Manufacturing industry emission factors (tCO2e per unit)
INDUSTRY_FACTORS = {
    "cement": {
        "electricity_kwh": 0.82 / 1000,  # tCO2e per kWh
        "diesel_liter": 2.68 / 1000,
        "natural_gas_m3": 2.0 / 1000,
        "cement_ton": 0.65,  # Per ton of cement
        "clinker_ratio": 0.75,
        "scope1_percentage": 62,
    },
    "steel": {
        "electricity_kwh": 0.82 / 1000,
        "diesel_liter": 2.68 / 1000,
        "coal_ton": 2.42,
        "steel_ton": 1.85,
        "scope1_percentage": 70,
    },
    "power": {
        "coal_ton": 2.42,
        "natural_gas_m3": 2.0 / 1000,
        "electricity_generated_mwh": 0.95,
        "scope1_percentage": 98,
    },
    "chemicals": {
        "electricity_kwh": 0.82 / 1000,
        "diesel_liter": 2.68 / 1000,
        "natural_gas_m3": 2.0 / 1000,
        "chemical_ton": 1.2,
        "scope1_percentage": 55,
    },
    "manufacturing": {
        "electricity_kwh": 0.82 / 1000,
        "diesel_liter": 2.68 / 1000,
        "natural_gas_m3": 2.0 / 1000,
        "production_units": 0.05,
        "scope1_percentage": 45,
    }
}

def get_industry_recommendations(industry, predicted_emission):
    """Get industry-specific recommendations"""
    
    base_recommendations = {
        "cement": [
            "Switch to blended cement (reduce clinker ratio by 5-10%)",
            "Implement waste heat recovery systems",
            "Use alternative fuels (biomass, refuse-derived fuel)",
            "Optimize kiln efficiency through better process control",
            "Invest in vertical roller mills for grinding"
        ],
        "steel": [
            "Transition to electric arc furnaces (EAF) from blast furnaces",
            "Implement top-gas recovery turbines",
            "Use scrap steel to reduce iron ore dependency",
            "Optimize blast furnace operations",
            "Invest in carbon capture technology"
        ],
        "power": [
            "Increase renewable energy mix (solar, wind)",
            "Upgrade to supercritical boilers (40%+ efficiency)",
            "Implement flue gas desulfurization",
            "Use low-carbon fuels (natural gas, biomass)",
            "Deploy carbon capture and storage (CCS)"
        ],
        "chemicals": [
            "Switch to green hydrogen for chemical processes",
            "Optimize steam network efficiency",
            "Use renewable electricity for electrolysis",
            "Implement heat integration across processes",
            "Reduce methane and N2O emissions"
        ],
        "manufacturing": [
            "Upgrade to energy-efficient machinery",
            "Implement LED lighting and HVAC optimization",
            "Use renewable electricity",
            "Optimize production schedules",
            "Reduce idle time and improve capacity utilization"
        ]
    }
    
    recommendations = base_recommendations.get(industry, base_recommendations["manufacturing"])
    
    # Add severity-based recommendations
    if predicted_emission > 5000:
        recommendations.insert(0, "⚠️ HIGH EMISSIONS: Immediate action required - consider major capital investments")
    elif predicted_emission > 2000:
        recommendations.insert(0, "⚡ MODERATE EMISSIONS: Focus on quick-win efficiency improvements")
    
    return recommendations[:5]  # Return top 5

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "service": "Organization ML Prediction API",
        "port": 8001,
        "focus": "Manufacturing Industries"
    })

@app.route('/predict/org', methods=['POST'])
def predict_organization():
    """
    Main prediction endpoint for organization emissions
    
    Request JSON:
    {
        "organizationId": "string",
        "industry": "cement",
        "historical_days": 30,
        "input_features": {
            "electricity_kwh": [array of 30 values],
            "diesel_liters": [array of 30 values],
            "natural_gas_m3": [array of 30 values],
            "production_units": [array of 30 values]
        }
    }
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "Missing request body"}), 400
        
        organization_id = data.get("organizationId") or data.get("organization_id") or "unknown"
        industry = (data.get("industry") or "manufacturing").lower()

        # Support period-based requests from backend
        period = data.get("period")
        historical_days = data.get("historical_days", 30)
        if period and isinstance(period, str) and "next_" in period and "_days" in period:
            try:
                historical_days = int(period.replace("next_", "").replace("_days", ""))
            except Exception:
                historical_days = historical_days or 30

        # Support two input formats:
        # 1) input_features: { electricity_kwh: [..], diesel_liters: [..], ... }
        # 2) historical_data: [{ electricity_kwh: x, diesel_liters: y, ... }, ...]
        input_features = data.get("input_features") or {}
        historical_data = data.get("historical_data") or []

        if historical_data and isinstance(historical_data, list):
            def pull_series(key):
                return [float(item.get(key, 0) or 0) for item in historical_data]

            input_features = {
                "electricity_kwh": pull_series("electricity_kwh"),
                "diesel_liters": pull_series("diesel_liters"),
                "natural_gas_m3": pull_series("natural_gas_m3"),
                "production_units": pull_series("production_units"),
            }
        
        # Validate industry
        if industry not in INDUSTRY_FACTORS:
            industry = "manufacturing"
        
        # Check if we have input features
        has_real_data = False
        for key, values in input_features.items():
            if values and len(values) > 0:
                has_real_data = True
                break
        
        predicted_emission = 0
        confidence = 0.70
        is_fallback = False
        
        if model and has_real_data:
            # Use ML model for prediction
            try:
                # Aggregate features
                features = {}
                for key, values in input_features.items():
                    if values and len(values) > 0:
                        features[f"{key}_avg"] = np.mean(values)
                        features[f"{key}_total"] = np.sum(values)
                        features[f"{key}_trend"] = values[-1] - values[0] if len(values) > 1 else 0
                    else:
                        features[f"{key}_avg"] = 0
                        features[f"{key}_total"] = 0
                        features[f"{key}_trend"] = 0
                
                # Create feature dataframe (model expects specific columns)
                feature_df = pd.DataFrame([{
                    'electricity_kwh': features.get('electricity_kwh_avg', 0),
                    'diesel_liter': features.get('diesel_liters_avg', 0),
                    'natural_gas_m3': features.get('natural_gas_m3_avg', 0),
                    'cement_ton': features.get('production_units_total', 0),
                    'production_units': features.get('production_units_avg', 0)
                }])
                
                # Make prediction
                prediction = model.predict(feature_df)[0]
                predicted_emission = float(prediction) * historical_days / 30  # Scale to period
                confidence = 0.87
                
                print(f"✓ ML Prediction for {organization_id}: {predicted_emission:.2f} tCO2e")
                
            except Exception as ml_error:
                print(f"⚠ ML prediction failed: {str(ml_error)}, using fallback")
                predicted_emission = calculate_fallback_emission(input_features, industry, historical_days)
                confidence = 0.65
                is_fallback = True
        else:
            # Use fallback calculation
            if has_real_data:
                predicted_emission = calculate_fallback_emission(input_features, industry, historical_days)
            else:
                # Use sample data as demo
                predicted_emission = get_sample_emission(industry, historical_days)
            
            confidence = 0.60
            is_fallback = True
            print(f"⚠ Using fallback prediction for {organization_id}")
        
        # Get recommendations
        recommendations = get_industry_recommendations(industry, predicted_emission)
        
        # Calculate industry insights
        industry_factors = INDUSTRY_FACTORS[industry]
        scope1_percentage = industry_factors.get('scope1_percentage', 50)
        
        response = {
            "success": True,
            "predicted_emission": round(predicted_emission, 2),
            "predicted_emissions": round(predicted_emission, 2),
            "period": f"next_{historical_days}_days",
            "confidence": confidence,
            "industry": industry.capitalize(),
            "recommendations": recommendations,
            "is_fallback": is_fallback,
            "breakdown": {
                "scope1_percentage": scope1_percentage,
                "scope2_percentage": 100 - scope1_percentage,
                "scope1_emission": round(predicted_emission * scope1_percentage / 100, 2),
                "scope2_emission": round(predicted_emission * (100 - scope1_percentage) / 100, 2)
            },
            "industry_insights": get_industry_insights(industry, predicted_emission),
            "timestamp": datetime.now().isoformat()
        }

        # Append prediction to CSVs for tracking (both root and predictions folder)
        try:
            if not os.path.exists(PREDICTIONS_DIR):
                os.makedirs(PREDICTIONS_DIR, exist_ok=True)

            def safe_avg(values):
                return float(np.mean(values)) if values else 0.0

            row = {
                "electricity_kwh": safe_avg(input_features.get("electricity_kwh", [])),
                "diesel_liter": safe_avg(input_features.get("diesel_liters", [])),
                "natural_gas_m3": safe_avg(input_features.get("natural_gas_m3", [])),
                "cement_ton": 0,
                "steel_ton": 0,
                "plastic_kg": 0,
                "production_units": safe_avg(input_features.get("production_units", [])),
                "operating_hours": 16,
                "capacity_utilization": 78,
                "energy_intensity": 3.3,
                "fuel_intensity": 50.0,
                "material_intensity": 0.0045,
                "load_efficiency": 285.0,
                "day_ahead": 1,
                "predicted_co2_kg": round(predicted_emission * 1000, 2),
                "target_co2_kg": round(predicted_emission * 1000 * 0.98, 2),
                "gap_kg": round(predicted_emission * 1000 * 0.02, 2),
                "status": "ABOVE TARGET" if predicted_emission > 0 else "ON TARGET",
                "recommendations": " | ".join(recommendations)
            }

            df_row = pd.DataFrame([row])

            # Append to root recommendations CSV
            if os.path.exists(RECOMMENDATIONS_PATH):
                df_row.to_csv(RECOMMENDATIONS_PATH, mode="a", header=False, index=False)
            else:
                df_row.to_csv(RECOMMENDATIONS_PATH, mode="w", header=True, index=False)

            # Append to predictions CSV
            if os.path.exists(PREDICTIONS_CSV):
                df_row.to_csv(PREDICTIONS_CSV, mode="a", header=False, index=False)
            else:
                df_row.to_csv(PREDICTIONS_CSV, mode="w", header=True, index=False)

        except Exception as csv_error:
            print(f"⚠ Failed to append prediction to CSV: {csv_error}")
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        return jsonify({
            "error": "Prediction failed",
            "message": str(e),
            "fallback_available": True
        }), 500

def calculate_fallback_emission(input_features, industry, days):
    """Calculate emission using emission factors"""
    total_emission = 0
    factors = INDUSTRY_FACTORS[industry]
    
    for key, values in input_features.items():
        if not values or len(values) == 0:
            continue
        
        total_value = sum(values)
        factor_key = key
        
        if factor_key in factors:
            emission = total_value * factors[factor_key]
            total_emission += emission
    
    # If no data, use average for industry
    if total_emission == 0:
        total_emission = get_sample_emission(industry, days)
    
    return total_emission

def get_sample_emission(industry, days):
    """Get sample emission based on industry average"""
    industry_averages = {
        "cement": 3200,  # tCO2e per month
        "steel": 4500,
        "power": 8500,
        "chemicals": 2800,
        "manufacturing": 1500
    }
    
    monthly_avg = industry_averages.get(industry, 1500)
    return monthly_avg * (days / 30)

def get_industry_insights(industry, predicted_emission):
    """Get industry-specific insights"""
    insights = {
        "cement": {
            "main_source": "Clinker production",
            "percentage": "62%",
            "reduction_potential": "15-20% through blended cement",
            "benchmark": "0.65 tCO2e per ton of cement"
        },
        "steel": {
            "main_source": "Blast furnace operations",
            "percentage": "70%",
            "reduction_potential": "30-40% through EAF adoption",
            "benchmark": "1.85 tCO2e per ton of steel"
        },
        "power": {
            "main_source": "Coal combustion",
            "percentage": "98%",
            "reduction_potential": "50-80% through renewable energy",
            "benchmark": "0.95 tCO2e per MWh"
        },
        "chemicals": {
            "main_source": "Process emissions",
            "percentage": "55%",
            "reduction_potential": "20-30% through green hydrogen",
            "benchmark": "1.2 tCO2e per ton of product"
        },
        "manufacturing": {
            "main_source": "Energy consumption",
            "percentage": "45%",
            "reduction_potential": "10-25% through efficiency",
            "benchmark": "Varies by product"
        }
    }
    
    return insights.get(industry, insights["manufacturing"])

@app.route('/industries', methods=['GET'])
def get_industries():
    """Return supported industries"""
    return jsonify({
        "industries": list(INDUSTRY_FACTORS.keys()),
        "focus": "Manufacturing sectors with high emissions",
        "default": "manufacturing"
    })

@app.route('/save-csv', methods=['POST'])
def save_to_csv():
    """Save prediction to CSV file"""
    try:
        data = request.get_json()
        
        # Extract data
        organization_id = data.get('organization_id', 'unknown')
        industry = data.get('industry', 'Manufacturing')
        period = data.get('period', 'next_30_days')
        predicted_emission = data.get('predicted_emission', 0)
        confidence = data.get('confidence', 0.70)
        breakdown = data.get('breakdown', {})
        recommendations = data.get('recommendations', [])
        
        # Parse period to get days
        period_days = 30
        if 'next_' in period and '_days' in period:
            try:
                period_days = int(period.replace('next_', '').replace('_days', ''))
            except:
                period_days = 30
        
        # Create CSV row with sample features
        csv_row = {
            'electricity_kwh': 15000.0,
            'diesel_liter': 200.0,
            'natural_gas_m3': 600.0,
            'cement_ton': 12.0,
            'steel_ton': 8.0,
            'plastic_kg': 350.0,
            'production_units': 4500.0,
            'operating_hours': 16,
            'capacity_utilization': 78,
            'energy_intensity': 3.3,
            'fuel_intensity': 50.0,
            'material_intensity': 0.0045,
            'load_efficiency': 285.0,
            'day_ahead': period_days,
            'predicted_co2_kg': predicted_emission * 1000,  # Convert tCO2e to kg
            'target_co2_kg': predicted_emission * 0.95 * 1000,  # 95% of prediction as target
            'gap_kg': predicted_emission * 0.05 * 1000,
            'status': 'ABOVE TARGET',
            'recommendations': ' | '.join(recommendations[:3]) if recommendations else 'No recommendations'
        }
        
        # Convert to DataFrame
        new_row_df = pd.DataFrame([csv_row])
        
        # Ensure predictions directory exists
        os.makedirs(PREDICTIONS_DIR, exist_ok=True)
        
        # Append to both CSV files
        csv_files = [
            RECOMMENDATIONS_PATH,  # Root directory
            PREDICTIONS_CSV  # Predictions subdirectory
        ]
        
        for csv_file in csv_files:
            try:
                if os.path.exists(csv_file):
                    # Append to existing CSV
                    new_row_df.to_csv(csv_file, mode='a', header=False, index=False)
                else:
                    # Create new CSV with header
                    new_row_df.to_csv(csv_file, mode='w', header=True, index=False)
                print(f"✓ Saved prediction to {csv_file}")
            except Exception as file_error:
                print(f"⚠ Error saving to {csv_file}: {str(file_error)}")
        
        return jsonify({
            "success": True,
            "message": "Prediction saved to CSV successfully",
            "files_updated": len([f for f in csv_files if os.path.exists(f)])
        })
        
    except Exception as e:
        print(f"❌ Error in save_to_csv: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🏭 Organization Emission Prediction API")
    print("="*60)
    print(f"📍 Running on: http://localhost:8001")
    print(f"🎯 Focus: Manufacturing Industries")
    print(f"🤖 Model Status: {'✓ Loaded' if model else '⚠ Fallback Mode'}")
    print("="*60 + "\n")
    
    app.run(host='0.0.0.0', port=8001, debug=True)
