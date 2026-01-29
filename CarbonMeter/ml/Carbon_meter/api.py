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

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 CarbonMeter ML API Server")
    print("=" * 50)
    print(f"Port: 8000")
    print(f"Health Check: http://localhost:8000/health")
    print(f"Prediction: POST http://localhost:8000/predict/missing-day")
    print("=" * 50)
    app.run(host='0.0.0.0', port=8000, debug=True)
