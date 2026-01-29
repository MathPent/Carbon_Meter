"""
============================================================
QUICK START SCRIPT - Industry Emission Prediction Pipeline
============================================================

This script demonstrates the complete workflow in one execution:
1. Generate sample input template
2. Run 30-day predictions
3. Run 180-day predictions  
4. Generate all visualizations

Perfect for first-time users and demonstrations.
============================================================
"""

import subprocess
import sys
import os

def run_command(description, command):
    """Execute a command and handle errors."""
    print("\n" + "="*70)
    print(f"▶️  {description}")
    print("="*70)
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=False,
            text=True
        )
        print(f"✅ {description} - COMPLETED")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - FAILED")
        print(f"Error: {e}")
        return False

def main():
    """Execute complete pipeline demonstration."""
    
    print("\n" + "🚀"*35)
    print("INDUSTRY CARBON EMISSION PREDICTION PIPELINE")
    print("COMPLETE DEMONSTRATION & QUICK START")
    print("🚀"*35)
    
    # Get Python executable path
    python_exe = sys.executable
    base_path = os.path.dirname(__file__)
    
    steps = [
        {
            "description": "Step 1: Generate Sample Input Template",
            "command": f'"{python_exe}" "{os.path.join(base_path, "generate_input_template.py")}"',
            "required": False
        },
        {
            "description": "Step 2: Run 30-Day Prediction",
            "command": f'"{python_exe}" "{os.path.join(base_path, "predict_future_emissions.py")}" --days 30',
            "required": True
        },
        {
            "description": "Step 3: Run 180-Day Prediction (6 months)",
            "command": f'"{python_exe}" "{os.path.join(base_path, "predict_future_emissions.py")}" --days 180',
            "required": True
        },
        {
            "description": "Step 4: Generate Basic Comparison Visualization",
            "command": f'"{python_exe}" "{os.path.join(base_path, "visualize_predictions.py")}"',
            "required": True
        },
        {
            "description": "Step 5: Generate Statistical Dashboard",
            "command": f'"{python_exe}" "{os.path.join(base_path, "visualize_predictions.py")}" --dashboard',
            "required": False
        }
    ]
    
    # Execute all steps
    results = []
    for step in steps:
        success = run_command(step["description"], step["command"])
        results.append(success)
        
        if not success and step["required"]:
            print("\n❌ Critical step failed. Stopping pipeline.")
            break
    
    # Summary
    print("\n" + "="*70)
    print("📊 PIPELINE EXECUTION SUMMARY")
    print("="*70)
    
    for i, (step, success) in enumerate(zip(steps, results), 1):
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{i}. {step['description']}: {status}")
    
    total_success = sum(results)
    total_steps = len(steps)
    
    print("\n" + "="*70)
    print(f"Completed: {total_success}/{total_steps} steps")
    print("="*70)
    
    # Output locations
    if sum(results) >= 3:  # At least predictions ran
        print("\n📁 OUTPUT FILES:")
        print("-" * 70)
        
        # List prediction files
        predictions_dir = os.path.join(base_path, 'predictions')
        if os.path.exists(predictions_dir):
            pred_files = [f for f in os.listdir(predictions_dir) 
                          if f.startswith('predicted_emissions_') and f.endswith('.csv')]
            print(f"  📁 predictions/")
            for f in sorted(pred_files, reverse=True)[:3]:  # Show latest 3
                print(f"    📄 {f}")
        
        # List visualization files
        repr_path = os.path.join(base_path, 'representation')
        if os.path.exists(repr_path):
            print(f"\n  📁 representation/")
            for f in sorted(os.listdir(repr_path), reverse=True)[:3]:  # Show latest 3
                if f.endswith('.png'):
                    print(f"    🖼️  {f}")
    
    print("\n" + "="*70)
    print("🎉 QUICK START COMPLETE!")
    print("="*70)
    print("\n📖 Next Steps:")
    print("  1. Review generated CSV predictions")
    print("  2. Check visualizations in representation/ folder")
    print("  3. Read README_PREDICTION_PIPELINE.md for detailed usage")
    print("  4. Read INTEGRATION_GUIDE.md for technical details")
    print("\n💡 For custom predictions, use:")
    print("  python predict_future_emissions.py --input your_data.csv --days 30")

if __name__ == "__main__":
    main()
