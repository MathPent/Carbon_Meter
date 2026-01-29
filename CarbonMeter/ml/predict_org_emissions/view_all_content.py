"""
============================================================
COMPLETE CONTENT VIEWER - Industry Carbon Prediction Pipeline
============================================================

This script displays ALL content from the prediction pipeline:
- Shows prediction CSV data
- Lists all generated files
- Displays statistics
- Opens visualizations
- Perfect for demonstrations and judge reviews

Run: python view_all_content.py
============================================================
"""

import pandas as pd
import os
import glob
from datetime import datetime

def print_header(title):
    """Print formatted section header"""
    print("\n" + "="*70)
    print(f"📊 {title}")
    print("="*70)

def view_predictions():
    """Display prediction CSV files"""
    print_header("PREDICTION FILES")
    
    predictions_dir = "predictions"
    if not os.path.exists(predictions_dir):
        print("❌ Predictions folder not found")
        return
    
    csv_files = sorted([f for f in os.listdir(predictions_dir) if f.endswith('.csv')], reverse=True)
    
    print(f"\n📁 Total prediction files: {len(csv_files)}")
    
    for i, file in enumerate(csv_files[:3], 1):  # Show latest 3
        print(f"\n{i}. {file}")
        file_path = os.path.join(predictions_dir, file)
        df = pd.read_csv(file_path)
        
        print(f"   - Rows: {len(df)}")
        print(f"   - Forecast days: {len(df)}")
        print(f"   - Estimated flag: {df['estimated'].unique()}")
        print(f"   - CO2 range: {df['predicted_co2_kg'].min():.2f} - {df['predicted_co2_kg'].max():.2f} kg")
        
        if i == 1:  # Show sample of latest file
            print(f"\n   📋 Sample data (first 5 rows):")
            print(df[['day_ahead', 'predicted_co2_kg', 'estimated']].head(5).to_string(index=False))

def view_visualizations():
    """Display visualization files"""
    print_header("VISUALIZATION FILES")
    
    repr_dir = "representation"
    if not os.path.exists(repr_dir):
        print("❌ Representation folder not found")
        return
    
    png_files = sorted(glob.glob(os.path.join(repr_dir, "*.png")), reverse=True)
    
    print(f"\n🖼️  Total visualization files: {len(png_files)}")
    
    for i, file in enumerate(png_files, 1):
        file_name = os.path.basename(file)
        file_size = os.path.getsize(file) / 1024  # KB
        print(f"\n{i}. {file_name}")
        print(f"   - Size: {file_size:.2f} KB")
        print(f"   - Type: {'Dashboard' if 'dashboard' in file_name else 'Comparison Graph'}")

def view_documentation():
    """Display documentation files"""
    print_header("DOCUMENTATION FILES")
    
    doc_files = [
        ("INDEX.md", "📖 Project Overview & Navigation"),
        ("README_PREDICTION_PIPELINE.md", "📖 User Guide & Quick Start"),
        ("INTEGRATION_GUIDE.md", "📖 Technical Documentation"),
        ("SUMMARY.md", "📖 Executive Summary"),
        ("REORGANIZATION_SUMMARY.md", "📖 Structure Changes Log")
    ]
    
    print(f"\n📚 Total documentation files: {len(doc_files)}")
    
    for i, (file, desc) in enumerate(doc_files, 1):
        if os.path.exists(file):
            size = os.path.getsize(file) / 1024
            with open(file, 'r', encoding='utf-8') as f:
                lines = len(f.readlines())
            print(f"\n{i}. {desc}")
            print(f"   File: {file}")
            print(f"   Size: {size:.2f} KB | Lines: {lines}")
        else:
            print(f"\n{i}. {desc} - ❌ Not found")

def view_models_and_data():
    """Display model and data files"""
    print_header("MODEL & DATA FILES")
    
    print("\n🤖 Model Files:")
    if os.path.exists("industry_xgboost_final.pkl"):
        size = os.path.getsize("industry_xgboost_final.pkl") / (1024 * 1024)
        print(f"   ✅ industry_xgboost_final.pkl ({size:.2f} MB)")
    
    print("\n📄 Template:")
    if os.path.exists("sample_30day_input_template.csv"):
        df_template = pd.read_csv("sample_30day_input_template.csv")
        print(f"   ✅ sample_30day_input_template.csv")
        print(f"      - Rows: {len(df_template)}")
        print(f"      - Columns: {len(df_template.columns)}")
        print(f"      - Features: {', '.join(df_template.columns[:5])}...")
    
    print("\n📊 Training Data:")
    data_file = os.path.join("data", "industry_emission_10k.csv")
    if os.path.exists(data_file):
        df_data = pd.read_csv(data_file)
        print(f"   ✅ industry_emission_10k.csv")
        print(f"      - Rows: {len(df_data):,}")
        print(f"      - Features: {len(df_data.columns)}")

def view_statistics():
    """Display overall statistics"""
    print_header("OVERALL STATISTICS")
    
    # Count predictions
    pred_files = len([f for f in os.listdir("predictions") if f.endswith('.csv')]) if os.path.exists("predictions") else 0
    
    # Count visualizations
    viz_files = len(glob.glob("representation/*.png")) if os.path.exists("representation") else 0
    
    # Count scripts
    script_files = len([f for f in os.listdir(".") if f.endswith('.py')])
    
    # Count docs
    doc_files = len([f for f in os.listdir(".") if f.endswith('.md')])
    
    print(f"\n📈 Project Statistics:")
    print(f"   - Production Scripts: {script_files}")
    print(f"   - Documentation Files: {doc_files}")
    print(f"   - Prediction CSVs: {pred_files}")
    print(f"   - Visualization PNGs: {viz_files}")
    print(f"   - Model Files: 1 (4+ MB)")
    
    print(f"\n✅ Status:")
    print(f"   - Pipeline: {'✅ Working' if pred_files > 0 else '⚠️ No predictions yet'}")
    print(f"   - Visualizations: {'✅ Generated' if viz_files > 0 else '⚠️ None generated'}")
    print(f"   - Documentation: {'✅ Complete' if doc_files >= 4 else '⚠️ Incomplete'}")

def open_visualizations():
    """Offer to open visualization files"""
    print_header("OPEN VISUALIZATIONS")
    
    png_files = sorted(glob.glob("representation/*.png"), reverse=True)
    
    if png_files:
        print(f"\nFound {len(png_files)} visualization(s)")
        print("\nTo open them:")
        print(f"   Windows: explorer representation")
        print(f"   Or: start {png_files[0]}")
    else:
        print("⚠️ No visualizations found. Run visualize_predictions.py first")

def main():
    """Main execution"""
    print("\n" + "🎉"*35)
    print("COMPLETE CONTENT VIEWER")
    print("Industry Carbon Emission Prediction Pipeline")
    print("🎉"*35)
    
    # Display all content
    view_predictions()
    view_visualizations()
    view_documentation()
    view_models_and_data()
    view_statistics()
    open_visualizations()
    
    print("\n" + "="*70)
    print("✅ CONTENT REVIEW COMPLETE")
    print("="*70)
    
    print("\n📌 Next Steps:")
    print("   1. To generate new predictions: python predict_future_emissions.py --days 30")
    print("   2. To create visualizations: python visualize_predictions.py --dashboard")
    print("   3. To run full demo: python quick_start.py")
    print("   4. To open graphs: explorer representation")
    
    print("\n📖 Documentation:")
    print("   - Start with: INDEX.md")
    print("   - User guide: README_PREDICTION_PIPELINE.md")
    print("   - Technical: INTEGRATION_GUIDE.md")


if __name__ == "__main__":
    main()
