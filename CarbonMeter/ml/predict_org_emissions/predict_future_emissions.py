"""
============================================================
INDUSTRY CARBON EMISSION - USER-FACING PREDICTION PIPELINE
============================================================

PURPOSE:
    This script allows users to input 30 days of historical 
    emission data and predict future emissions for:
    - Next 30 days (1 month)
    - Next 180 days (6 months)

WORKFLOW:
    1. Accept 30 days of historical emission records
    2. Load trained model (industry_xgboost_final.pkl)
    3. Generate recursive predictions (estimated=1)
    4. Save predictions to CSV
    5. Generate comparison visualization
    
USAGE:
    python predict_future_emissions.py --input historical_30days.csv --days 30
    python predict_future_emissions.py --input historical_30days.csv --days 180
    
============================================================
"""

import pandas as pd
import numpy as np
import joblib
import os
import argparse
from datetime import datetime, timedelta


class IndustryEmissionPredictor:
    """
    Main prediction engine for industrial carbon emissions.
    Uses pre-trained XGBoost model for forecasting.
    """
    
    def __init__(self, model_path=None):
        """
        Initialize predictor with trained model.
        
        Args:
            model_path (str): Path to trained model pickle file
        """
        if model_path is None:
            model_path = os.path.join(
                os.path.dirname(__file__), 
                "industry_xgboost_final.pkl"
            )
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model not found at {model_path}\n"
                "Please ensure industry_xgboost_final.pkl exists in industry_model/"
            )
        
        self.model = joblib.load(model_path)
        print(f"✅ Model loaded from: {model_path}")
    
    
    def validate_input_data(self, df):
        """
        Validate that input data has required features.
        
        Args:
            df (pd.DataFrame): Input historical data
            
        Returns:
            bool: True if valid, raises error otherwise
        """
        required_base_features = [
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
        
        missing = [col for col in required_base_features if col not in df.columns]
        
        if missing:
            raise ValueError(
                f"Missing required columns: {missing}\n"
                f"Required: {required_base_features}"
            )
        
        if len(df) != 30:
            print(f"⚠️ Warning: Expected 30 days, got {len(df)} days")
        
        return True
    
    
    def engineer_features(self, row):
        """
        Apply physics-aware feature engineering (MUST match training).
        
        Args:
            row (dict): Single day's operational data
            
        Returns:
            dict: Row with engineered features added
        """
        row['energy_intensity'] = row['electricity_kwh'] / row['production_units']
        
        row['fuel_intensity'] = (
            row['diesel_liter'] + row['natural_gas_m3']
        ) / row['operating_hours']
        
        row['material_intensity'] = (
            row['cement_ton'] +
            row['steel_ton'] +
            (row['plastic_kg'] / 1000)
        ) / row['production_units']
        
        row['load_efficiency'] = row['production_units'] / row['operating_hours']
        
        return row
    
    
    def predict_next_days(self, historical_df, forecast_days=30, growth_rate=0.02):
        """
        Generate recursive predictions for future days.
        
        Args:
            historical_df (pd.DataFrame): Last 30 days of actual data
            forecast_days (int): Number of days to predict (30 or 180)
            growth_rate (float): Weekly growth rate (default 2%)
            
        Returns:
            pd.DataFrame: Predictions with estimated=1 flag
        """
        print(f"\n🔮 Generating {forecast_days}-day forecast...")
        
        # Validate input
        self.validate_input_data(historical_df)
        
        # Get last known operational state
        last_row = historical_df.iloc[-1].copy()
        
        # Calculate daily growth factor
        daily_growth = growth_rate / 7
        
        predictions = []
        
        for day in range(1, forecast_days + 1):
            # Apply growth factor
            growth_factor = 1 + (daily_growth * day)
            
            future_row = last_row.copy()
            
            # Scale operational parameters with growth
            scalable_features = [
                'electricity_kwh',
                'diesel_liter',
                'natural_gas_m3',
                'cement_ton',
                'steel_ton',
                'plastic_kg',
                'production_units'
            ]
            
            for feature in scalable_features:
                if feature in future_row:
                    future_row[feature] *= growth_factor
            
            # Re-engineer features with updated values
            future_row = self.engineer_features(future_row)
            
            # Prepare feature vector for prediction
            feature_cols = [
                'electricity_kwh',
                'diesel_liter',
                'natural_gas_m3',
                'cement_ton',
                'steel_ton',
                'plastic_kg',
                'production_units',
                'operating_hours',
                'capacity_utilization',
                'energy_intensity',
                'fuel_intensity',
                'material_intensity',
                'load_efficiency'
            ]
            
            X_future = pd.DataFrame([future_row[feature_cols]])
            
            # Predict CO2 emission
            predicted_co2 = self.model.predict(X_future)[0]
            
            # Store prediction
            prediction_record = future_row.to_dict()
            prediction_record['day_ahead'] = day
            prediction_record['predicted_co2_kg'] = round(predicted_co2, 2)
            prediction_record['estimated'] = 1  # FLAG: This is predicted
            
            predictions.append(prediction_record)
            
            # Progress indicator
            if day % 30 == 0:
                print(f"   ✓ Predicted day {day}/{forecast_days}")
        
        return pd.DataFrame(predictions)
    
    
    def save_predictions(self, predictions_df, output_path=None):
        """
        Save predictions to CSV in industry_model/predictions/.
        
        Args:
            predictions_df (pd.DataFrame): Prediction results
            output_path (str): Optional custom output path
            
        Returns:
            str: Path where file was saved
        """
        if output_path is None:
            forecast_days = len(predictions_df)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"predicted_emissions_{forecast_days}days_{timestamp}.csv"
            predictions_dir = os.path.join(os.path.dirname(__file__), "predictions")
            os.makedirs(predictions_dir, exist_ok=True)
            output_path = os.path.join(predictions_dir, filename)
        
        predictions_df.to_csv(output_path, index=False)
        print(f"\n💾 Predictions saved to: {output_path}")
        
        return output_path


def load_historical_data(input_source):
    """
    Load 30-day historical data from CSV or DataFrame.
    
    Args:
        input_source: Either path to CSV file or pandas DataFrame
        
    Returns:
        pd.DataFrame: Validated historical data
    """
    if isinstance(input_source, str):
        # Load from CSV
        if not os.path.exists(input_source):
            raise FileNotFoundError(f"Input file not found: {input_source}")
        df = pd.read_csv(input_source)
        print(f"📂 Loaded {len(df)} days from: {input_source}")
    
    elif isinstance(input_source, pd.DataFrame):
        df = input_source.copy()
        print(f"📂 Loaded {len(df)} days from DataFrame")
    
    else:
        raise TypeError("Input must be CSV path (str) or pandas DataFrame")
    
    return df


def main():
    """
    Main execution function with CLI support.
    """
    parser = argparse.ArgumentParser(
        description="Predict future industrial carbon emissions"
    )
    
    parser.add_argument(
        '--input',
        type=str,
        default=None,
        help='Path to CSV with 30 days of historical data'
    )
    
    parser.add_argument(
        '--days',
        type=int,
        choices=[30, 180],
        default=30,
        help='Number of days to predict (30 or 180)'
    )
    
    parser.add_argument(
        '--growth',
        type=float,
        default=0.02,
        help='Weekly growth rate (default: 0.02 = 2%%)'
    )
    
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("INDUSTRY CARBON EMISSION PREDICTION PIPELINE")
    print("="*60)
    
    # If no input provided, create sample data from existing CSV
    if args.input is None:
        print("\n⚠️ No input file specified. Using last 30 days from existing data...")
        data_path = os.path.join(
            os.path.dirname(__file__),
            "data",
            "industry_emission_10k.csv"
        )
        
        if os.path.exists(data_path):
            full_data = pd.read_csv(data_path)
            historical_df = full_data.tail(30).copy()
            print(f"   Using last 30 days from: {data_path}")
        else:
            raise FileNotFoundError(
                "No input provided and sample data not found.\n"
                "Please provide --input parameter."
            )
    else:
        historical_df = load_historical_data(args.input)
    
    # Initialize predictor
    predictor = IndustryEmissionPredictor()
    
    # Generate predictions
    predictions = predictor.predict_next_days(
        historical_df,
        forecast_days=args.days,
        growth_rate=args.growth
    )
    
    # Save results
    output_path = predictor.save_predictions(predictions)
    
    print("\n" + "="*60)
    print("✅ PREDICTION COMPLETE")
    print("="*60)
    print(f"Forecasted Days: {args.days}")
    print(f"Growth Rate: {args.growth*100}% weekly")
    print(f"Output File: {output_path}")
    print("\nNext Step: Run visualize_predictions.py to generate graphs")
    
    return predictions, historical_df


if __name__ == "__main__":
    predictions, historical_data = main()
