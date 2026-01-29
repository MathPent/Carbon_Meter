from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for Node.js backend

# Get the directory of this script
script_dir = os.path.dirname(os.path.abspath(__file__))

# Load trained model from the same directory as api.py
model_path = os.path.join(script_dir, "carbonmeter_behavioral_model.pkl")

if not os.path.exists(model_path):
    print(f"⚠️  Model file not found at {model_path}")
    print(f"📂 Current directory: {os.getcwd()}")
    print(f"📂 Script directory: {script_dir}")
    model = None
else:
    try:
        model = joblib.load(model_path)
        print(f"✅ Model loaded from {model_path}")
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        model = None

# Load organization XGBoost model
org_model_path = os.path.join(script_dir, "..", "predict_org_emissions", "industry_xgboost_final.pkl")
org_model = None
if os.path.exists(org_model_path):
    try:
        org_model = joblib.load(org_model_path)
        print(f"✅ Organization model loaded from {org_model_path}")
    except Exception as e:
        print(f"❌ Error loading organization model: {str(e)}")

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ML service running",
        "model_loaded": model is not None,
        "port": 8000
    })

@app.route("/predict/missing-day", methods=["POST"])
def predict_missing_day():
    try:
        # Check if model is loaded
        if model is None:
            # Return fallback prediction for demo mode
            return jsonify({
                "predicted_co2": 3.8,
                "confidence": 0.75,
                "demo": True,
                "source": "Fallback Model",
                "message": "Model not loaded - using fallback prediction"
            }), 200

        data = request.json
        
        # Validate input
        if not data:
            return jsonify({
                "error": "Missing request body"
            }), 400

        # Support both 'emission_history' and 'lastNDays' formats
        emission_history = data.get("emission_history", [])
        user_id = data.get("userId", "unknown")

        # Check minimum data requirement
        if len(emission_history) < 5:
            # Return fallback for insufficient data
            return jsonify({
                "predicted_co2": 3.5,
                "confidence": 0.65,
                "demo": True,
                "source": "Fallback Model",
                "message": f"Not enough historical data. Need at least 5 days, got {len(emission_history)}.",
                "days_used": len(emission_history)
            }), 200

        # Validate numeric values
        try:
            emission_array = [float(x) for x in emission_history]
        except (ValueError, TypeError):
            return jsonify({
                "error": "Invalid data format. All values must be numeric."
            }), 400

        # Prepare input for model
        X = np.array(emission_array).reshape(1, -1)
        
        # Make prediction
        prediction = model.predict(X)[0]
        
        # Calculate confidence score (0-1 range)
        confidence_score = 0.75  # Base confidence
        if len(emission_history) >= 15:
            confidence_score = 0.90
        elif len(emission_history) >= 10:
            confidence_score = 0.82
        elif len(emission_history) < 7:
            confidence_score = 0.65

        return jsonify({
            "predicted_co2": round(float(prediction), 2),
            "confidence": confidence_score,
            "demo": False,
            "source": "Behavioral ML Model",
            "days_used": len(emission_history),
            "message": f"Prediction based on {len(emission_history)} days of historical data"
        })

    except Exception as e:
        # Return fallback on error
        return jsonify({
            "predicted_co2": 4.0,
            "confidence": 0.70,
            "demo": True,
            "source": "Fallback Model",
            "error": f"Prediction failed: {str(e)}"
        }), 200

@app.route("/predict/organization", methods=["POST"])
def predict_organization():
    """
    Organization-level emission prediction endpoint.
    
    Expects:
    {
        "organizationId": "string",
        "sector": "string",
        "emission_history": [array of historical emissions],
        "employee_count": number,
        "revenue": number (optional),
        "period": "string" (e.g., "2026-02")
    }
    
    Returns:
    {
        "predicted_emission": number,
        "trend": "increasing/decreasing/stable",
        "confidence": number (0-1),
        "period": "string",
        "benchmark_percentile": number,
        "source": "string"
    }
    """
    try:
        data = request.json
        
        # Validate input
        if not data:
            return jsonify({"error": "Missing request body"}), 400
            
        organization_id = data.get("organizationId")
        sector = data.get("sector", "Technology")
        emission_history = data.get("emission_history", [])
        employee_count = data.get("employee_count", 100)
        revenue = data.get("revenue", 0)
        period = data.get("period", "2026-02")
        
        if not organization_id:
            return jsonify({"error": "organizationId is required"}), 400
        
        # Check if organization model is loaded
        if org_model is None:
            # Use fallback calculation based on historical average
            if len(emission_history) > 0:
                avg_emission = np.mean(emission_history)
                recent_trend = emission_history[-3:] if len(emission_history) >= 3 else emission_history
                trend_direction = "stable"
                
                if len(recent_trend) >= 2:
                    if recent_trend[-1] > recent_trend[0] * 1.1:
                        trend_direction = "increasing"
                    elif recent_trend[-1] < recent_trend[0] * 0.9:
                        trend_direction = "decreasing"
                
                predicted_emission = avg_emission * 1.05  # 5% growth assumption
            else:
                # Industry averages as fallback (Manufacturing focus)
                sector_defaults = {
                    "Technology": 85.0,
                    "Manufacturing": 320.0,  # Increased for manufacturing focus
                    "Heavy Manufacturing": 450.0,
                    "Light Manufacturing": 280.0,
                    "Automotive Manufacturing": 380.0,
                    "Chemical Manufacturing": 420.0,
                    "Food & Beverage Manufacturing": 290.0,
                    "Textile Manufacturing": 310.0,
                    "Electronics Manufacturing": 240.0,
                    "Metal Fabrication": 410.0,
                    "Services": 120.0,
                    "Retail": 95.0,
                    "Finance": 65.0
                }
                predicted_emission = sector_defaults.get(sector, 100.0)
                trend_direction = "stable"
            
            return jsonify({
                "predicted_emission": round(predicted_emission, 2),
                "trend": trend_direction,
                "confidence": 0.70,
                "period": period,
                "benchmark_percentile": 55,
                "source": "Fallback Estimation",
                "demo": True,
                "message": "Organization model not loaded - using fallback"
            }), 200
        
        # Prepare features for ML model
        # Feature engineering based on organization data
        if len(emission_history) > 0:
            recent_avg = np.mean(emission_history[-30:]) if len(emission_history) >= 30 else np.mean(emission_history)
            emission_trend = (emission_history[-1] / emission_history[0] - 1) if len(emission_history) > 1 else 0
            emission_volatility = np.std(emission_history) if len(emission_history) > 1 else 0
        else:
            recent_avg = 100.0
            emission_trend = 0.0
            emission_volatility = 10.0
        
        # Sector encoding (Manufacturing industries get detailed classification)
        sector_map = {
            "Technology": 1,
            "Manufacturing": 2,
            "Heavy Manufacturing": 21,
            "Light Manufacturing": 22,
            "Automotive Manufacturing": 23,
            "Chemical Manufacturing": 24,
            "Food & Beverage Manufacturing": 25,
            "Textile Manufacturing": 26,
            "Electronics Manufacturing": 27,
            "Metal Fabrication": 28,
            "Services": 3,
            "Retail": 4,
            "Finance": 5,
            "Healthcare": 6,
            "Energy": 7,
            "Transportation": 8
        }
        sector_code = sector_map.get(sector, 1)
        
        # Manufacturing-specific emission factor adjustment
        is_manufacturing = sector_code >= 2 and sector_code <= 28
        manufacturing_multiplier = 1.3 if is_manufacturing else 1.0
        
        # Create feature vector (adjusted for manufacturing focus)
        features = pd.DataFrame({
            'recent_avg_emission': [recent_avg * manufacturing_multiplier],
            'emission_trend': [emission_trend],
            'emission_volatility': [emission_volatility],
            'employee_count': [employee_count],
            'sector_code': [sector_code],
            'revenue_per_employee': [revenue / employee_count if employee_count > 0 and revenue > 0 else 0],
            'is_manufacturing': [1 if is_manufacturing else 0]
        })
        
        # Make prediction
        try:
            # Ensure model has required features (basic XGBoost compatibility)
            model_features = list(features.columns[:6])  # Use first 6 features for compatibility
            prediction_features = features[model_features]
            
            prediction = org_model.predict(prediction_features)[0]
            
            # Apply manufacturing multiplier to prediction
            if is_manufacturing:
                prediction = prediction * manufacturing_multiplier
            
            # Calculate confidence based on data quality
            confidence = 0.75
            if len(emission_history) >= 90:  # 3 months
                confidence = 0.92
            elif len(emission_history) >= 30:
                confidence = 0.85
            elif len(emission_history) < 15:
                confidence = 0.68
            
            # Manufacturing industries get slightly lower confidence due to variability
            if is_manufacturing:
                confidence = confidence * 0.95
                
            # Determine trend
            if len(emission_history) >= 3:
                recent_trend = emission_history[-3:]
                if recent_trend[-1] > recent_trend[0] * 1.1:
                    trend = "increasing"
                elif recent_trend[-1] < recent_trend[0] * 0.9:
                    trend = "decreasing"
                else:
                    trend = "stable"
            else:
                trend = "stable"
            
            # Calculate benchmark percentile (normalized to 0-100)
            # Lower emissions = higher percentile (better performance)
            benchmark_percentile = max(10, min(95, 100 - (prediction / 5)))
            
            return jsonify({
                "predicted_emission": round(float(prediction), 2),
                "trend": trend,
                "confidence": confidence,
                "period": period,
                "benchmark_percentile": round(benchmark_percentile, 1),
                "source": "XGBoost ML Model",
                "demo": False,
                "message": f"Prediction based on {len(emission_history)} days of data"
            }), 200
            
        except Exception as pred_error:
            print(f"Prediction error: {str(pred_error)}")
            # Fallback to simple average
            fallback_value = np.mean(emission_history) if len(emission_history) > 0 else 100.0
            return jsonify({
                "predicted_emission": round(fallback_value, 2),
                "trend": "stable",
                "confidence": 0.65,
                "period": period,
                "benchmark_percentile": 50,
                "source": "Fallback Estimation",
                "demo": True,
                "error": str(pred_error)
            }), 200
            
    except Exception as e:
        return jsonify({
            "error": f"Organization prediction failed: {str(e)}",
            "predicted_emission": 100.0,
            "confidence": 0.5,
            "source": "Error Fallback"
        }), 200

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 CarbonMeter ML API Server")
    print("=" * 50)
    print(f"Port: 8000")
    print(f"Health Check: http://localhost:8000/health")
    print(f"Prediction: POST http://localhost:8000/predict/missing-day")
    print("=" * 50)
    app.run(host='0.0.0.0', port=8000, debug=True)
