"""
CarbonMeter ML Prediction API (Flask)
Port: 5001
Stable, demo-ready ML service for hackathon
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
import sys

app = Flask(__name__)
CORS(app)  # Enable CORS for local development

# ============================================================
# Model Loading (Robust Path Resolution)
# ============================================================
MODEL_LOADED = False
model = None

def load_model():
    """Load ML model from disk with robust path handling"""
    global model, MODEL_LOADED
    
    try:
        # Get absolute path to this file's directory
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Try multiple possible model locations
        possible_paths = [
            os.path.join(base_dir, 'carbonmeter_behavioral_model.pkl'),
            os.path.join(base_dir, 'model_rel', 'carbonmeter_behavioral_model.pkl'),
            os.path.join(base_dir, 'model.pkl'),
        ]
        
        for model_path in possible_paths:
            if os.path.exists(model_path):
                print(f"✅ Loading model from: {model_path}")
                model = joblib.load(model_path)
                MODEL_LOADED = True
                print("✅ ML Model loaded successfully")
                return True
        
        print("⚠️  Model file not found in any expected location:")
        for path in possible_paths:
            print(f"   - {path}")
        return False
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

# Attempt to load model on startup
load_model()

# ============================================================
# Confidence Calculation (Simple & Explainable)
# ============================================================
def calculate_confidence(num_days):
    """
    Calculate confidence level based on input size
    1 day → low
    2-4 days → medium
    5+ days → high
    """
    if num_days == 1:
        return "low"
    elif num_days <= 4:
        return "medium"
    else:
        return "high"

# ============================================================
# API Endpoints
# ============================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "ok": True,
        "service": "carbonmeter-ml",
        "modelLoaded": MODEL_LOADED,
        "port": 5001
    })

@app.route('/predict-missing', methods=['POST'])
def predict_missing():
    """
    Predict missing day emission based on recent history
    
    Input: { "last_n_days": [12.3, 10.8, 11.5] }
    Output: { "predicted_co2": 11.2, "confidence": "medium" }
    """
    
    # Check if model is loaded
    if not MODEL_LOADED or model is None:
        return jsonify({
            "error": "Model not loaded",
            "message": "ML model is not available. Please check server logs.",
            "predicted_co2": None,
            "confidence": "none"
        }), 503
    
    try:
        # Get input data
        data = request.get_json()
        
        if not data or 'last_n_days' not in data:
            return jsonify({
                "error": "Missing required field",
                "message": "Request must include 'last_n_days' array"
            }), 400
        
        last_n_days = data['last_n_days']
        
        # Validate input
        if not isinstance(last_n_days, list):
            return jsonify({
                "error": "Invalid input type",
                "message": "'last_n_days' must be an array of numbers"
            }), 400
        
        # Filter to numeric values only (demo-ready)
        valid_values = []
        for val in last_n_days:
            try:
                num = float(val)
                if not np.isnan(num) and not np.isinf(num):
                    valid_values.append(num)
            except (ValueError, TypeError):
                continue
        
        # Check if we have valid data
        if len(valid_values) == 0:
            return jsonify({
                "error": "No valid data",
                "message": "No valid numeric values found in input. Please provide at least one emission value."
            }), 422
        
        # Limit to 1-20 days as specified
        if len(valid_values) > 20:
            valid_values = valid_values[-20:]
        
        # Calculate features for prediction
        # Use simple statistical features that work with any model
        features = [
            np.mean(valid_values),           # avg_emission
            np.std(valid_values) if len(valid_values) > 1 else 0,  # std_emission
            np.min(valid_values),            # min_emission
            np.max(valid_values),            # max_emission
            len(valid_values)                # days_count
        ]
        
        # Make prediction
        try:
            prediction = model.predict([features])[0]
            
            # Safety checks on prediction
            if np.isnan(prediction) or np.isinf(prediction):
                prediction = np.mean(valid_values)  # Fallback to mean
            
            # Clamp to non-negative
            prediction = max(0, float(prediction))
            
        except Exception as pred_error:
            print(f"⚠️  Prediction error: {pred_error}")
            # Fallback: use recent average
            prediction = float(np.mean(valid_values))
        
        # Calculate confidence
        confidence = calculate_confidence(len(valid_values))
        
        # Return result
        return jsonify({
            "predicted_co2": round(prediction, 2),
            "confidence": confidence,
            "days_used": len(valid_values)
        })
        
    except Exception as e:
        print(f"❌ Error in /predict-missing: {e}")
        return jsonify({
            "error": "Prediction failed",
            "message": str(e)
        }), 500

# ============================================================
# Run Server
# ============================================================
if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 CarbonMeter ML API Starting...")
    print("="*60)
    print(f"Model Status: {'✅ Loaded' if MODEL_LOADED else '❌ Not Loaded'}")
    print("Port: 5001")
    print("="*60 + "\n")
    
    # Run on port 5001
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False  # Set to False for production/demo
    )
