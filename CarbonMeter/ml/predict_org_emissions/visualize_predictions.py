"""
============================================================
INDUSTRY CARBON EMISSION - VISUALIZATION MODULE
============================================================

PURPOSE:
    Generate professional comparison graphs showing:
    - Historical calculated emissions (estimated=0)
    - Future predicted emissions (estimated=1)
    
    Graphs are saved to industry_model/representation/

FEATURES:
    ✓ Clear visual distinction (solid vs dashed lines)
    ✓ Vertical separator between past and future
    ✓ Professional styling for ESG presentations
    ✓ Automatic saving to representation folder
    
USAGE:
    python visualize_predictions.py --historical data.csv --predicted predictions.csv
    
============================================================
"""

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import os
import argparse
from datetime import datetime, timedelta
import numpy as np


class EmissionVisualizer:
    """
    Handles all visualization tasks for emission predictions.
    Designed for judge-ready, industry-focused presentations.
    """
    
    def __init__(self, output_dir=None):
        """
        Initialize visualizer with output directory.
        
        Args:
            output_dir (str): Directory to save graphs
        """
        if output_dir is None:
            output_dir = os.path.join(
                os.path.dirname(__file__),
                "representation"
            )
        
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Set professional style
        plt.style.use('seaborn-v0_8-darkgrid')
        
    
    def prepare_timeline(self, historical_df, predicted_df):
        """
        Create unified timeline for historical + predicted data.
        
        Args:
            historical_df (pd.DataFrame): Historical emissions
            predicted_df (pd.DataFrame): Predicted emissions
            
        Returns:
            tuple: (historical_dates, predicted_dates)
        """
        num_historical = len(historical_df)
        num_predicted = len(predicted_df)
        
        # If dates exist, use them; otherwise create indices
        if 'date' in historical_df.columns:
            historical_dates = pd.to_datetime(historical_df['date'])
            last_date = historical_dates.iloc[-1]
            predicted_dates = [
                last_date + timedelta(days=i+1) 
                for i in range(num_predicted)
            ]
        else:
            # Use day indices
            historical_dates = list(range(1, num_historical + 1))
            predicted_dates = list(range(
                num_historical + 1, 
                num_historical + num_predicted + 1
            ))
        
        return historical_dates, predicted_dates
    
    
    def plot_comparison(
        self, 
        historical_df, 
        predicted_df, 
        title="Historical vs Predicted Industrial Carbon Emissions",
        filename=None
    ):
        """
        Generate main comparison visualization.
        
        Args:
            historical_df (pd.DataFrame): Historical data (estimated=0)
            predicted_df (pd.DataFrame): Predicted data (estimated=1)
            title (str): Graph title
            filename (str): Output filename
            
        Returns:
            str: Path to saved figure
        """
        print("\n📊 Generating comparison visualization...")
        
        # Prepare timeline
        hist_dates, pred_dates = self.prepare_timeline(historical_df, predicted_df)
        
        # Extract emission values
        if 'co2_emission' in historical_df.columns:
            hist_emissions = historical_df['co2_emission'].values
        elif 'predicted_co2_kg' in historical_df.columns:
            hist_emissions = historical_df['predicted_co2_kg'].values
        else:
            raise ValueError("Cannot find emission column in historical data")
        
        pred_emissions = predicted_df['predicted_co2_kg'].values
        
        # Create figure
        fig, ax = plt.subplots(figsize=(14, 6))
        
        # Plot historical (solid line - blue)
        ax.plot(
            hist_dates,
            hist_emissions,
            color='#2E86AB',
            linewidth=2.5,
            label='Historical (Calculated)',
            marker='o',
            markersize=4,
            markerfacecolor='white',
            markeredgewidth=1.5
        )
        
        # Plot predicted (dashed line - orange)
        ax.plot(
            pred_dates,
            pred_emissions,
            color='#F77F00',
            linewidth=2.5,
            linestyle='--',
            label='Predicted (AI Forecast)',
            marker='s',
            markersize=4,
            markerfacecolor='white',
            markeredgewidth=1.5
        )
        
        # Add vertical separator
        if isinstance(hist_dates, list):
            separator_x = hist_dates[-1] + 0.5
        else:
            separator_x = hist_dates.iloc[-1]
        
        ax.axvline(
            x=separator_x,
            color='red',
            linestyle=':',
            linewidth=2,
            alpha=0.7,
            label='Prediction Start'
        )
        
        # Shade future region
        ax.axvspan(
            separator_x,
            pred_dates[-1],
            alpha=0.1,
            color='orange',
            label='Forecast Period'
        )
        
        # Styling
        ax.set_xlabel('Timeline (Days)', fontsize=12, fontweight='bold')
        ax.set_ylabel('CO₂ Emissions (kg)', fontsize=12, fontweight='bold')
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
        
        # Grid
        ax.grid(True, alpha=0.3, linestyle='--', linewidth=0.5)
        
        # Legend
        ax.legend(
            loc='upper left',
            fontsize=10,
            framealpha=0.95,
            edgecolor='black'
        )
        
        # Format x-axis if using dates
        if not isinstance(hist_dates, list):
            ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
            plt.xticks(rotation=45, ha='right')
        
        plt.tight_layout()
        
        # Save figure
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"historical_vs_predicted_{timestamp}.png"
        
        output_path = os.path.join(self.output_dir, filename)
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        print(f"✅ Graph saved to: {output_path}")
        
        plt.show()
        
        return output_path
    
    
    def plot_statistical_summary(
        self,
        historical_df,
        predicted_df,
        filename=None
    ):
        """
        Generate statistical comparison dashboard.
        
        Args:
            historical_df (pd.DataFrame): Historical data
            predicted_df (pd.DataFrame): Predicted data
            filename (str): Output filename
            
        Returns:
            str: Path to saved figure
        """
        print("\n📈 Generating statistical summary...")
        
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle(
            'Industrial Carbon Emission Analysis Dashboard',
            fontsize=16,
            fontweight='bold'
        )
        
        # Extract values
        if 'co2_emission' in historical_df.columns:
            hist_emissions = historical_df['co2_emission'].values
        else:
            hist_emissions = historical_df['predicted_co2_kg'].values
        
        pred_emissions = predicted_df['predicted_co2_kg'].values
        
        # 1. Emission Trend Comparison
        ax1 = axes[0, 0]
        days_hist = np.arange(1, len(hist_emissions) + 1)
        days_pred = np.arange(len(hist_emissions) + 1, len(hist_emissions) + len(pred_emissions) + 1)
        
        ax1.plot(days_hist, hist_emissions, 'b-', linewidth=2, label='Historical')
        ax1.plot(days_pred, pred_emissions, 'r--', linewidth=2, label='Predicted')
        ax1.axvline(x=len(hist_emissions), color='green', linestyle=':', linewidth=2)
        ax1.set_xlabel('Day')
        ax1.set_ylabel('CO₂ (kg)')
        ax1.set_title('Emission Trend Over Time')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # 2. Distribution Comparison
        ax2 = axes[0, 1]
        ax2.hist(hist_emissions, bins=20, alpha=0.6, color='blue', label='Historical', edgecolor='black')
        ax2.hist(pred_emissions, bins=20, alpha=0.6, color='orange', label='Predicted', edgecolor='black')
        ax2.set_xlabel('CO₂ Emissions (kg)')
        ax2.set_ylabel('Frequency')
        ax2.set_title('Emission Distribution')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        # 3. Statistics Table
        ax3 = axes[1, 0]
        ax3.axis('off')
        
        stats_data = [
            ['Metric', 'Historical', 'Predicted', 'Change'],
            ['Mean (kg)', f"{hist_emissions.mean():.2f}", f"{pred_emissions.mean():.2f}", 
             f"{((pred_emissions.mean() - hist_emissions.mean()) / hist_emissions.mean() * 100):+.1f}%"],
            ['Median (kg)', f"{np.median(hist_emissions):.2f}", f"{np.median(pred_emissions):.2f}",
             f"{((np.median(pred_emissions) - np.median(hist_emissions)) / np.median(hist_emissions) * 100):+.1f}%"],
            ['Std Dev (kg)', f"{hist_emissions.std():.2f}", f"{pred_emissions.std():.2f}", '-'],
            ['Min (kg)', f"{hist_emissions.min():.2f}", f"{pred_emissions.min():.2f}", '-'],
            ['Max (kg)', f"{hist_emissions.max():.2f}", f"{pred_emissions.max():.2f}", '-'],
            ['Total (tons)', f"{hist_emissions.sum()/1000:.2f}", f"{pred_emissions.sum()/1000:.2f}",
             f"{((pred_emissions.sum() - hist_emissions.sum()) / hist_emissions.sum() * 100):+.1f}%"]
        ]
        
        table = ax3.table(
            cellText=stats_data,
            cellLoc='center',
            loc='center',
            colWidths=[0.3, 0.25, 0.25, 0.2]
        )
        table.auto_set_font_size(False)
        table.set_fontsize(9)
        table.scale(1, 2)
        
        # Header styling
        for i in range(4):
            table[(0, i)].set_facecolor('#2E86AB')
            table[(0, i)].set_text_props(weight='bold', color='white')
        
        ax3.set_title('Statistical Comparison', fontweight='bold', pad=20)
        
        # 4. Cumulative Emissions
        ax4 = axes[1, 1]
        cumulative_hist = np.cumsum(hist_emissions)
        cumulative_pred = np.cumsum(pred_emissions)
        
        ax4.plot(days_hist, cumulative_hist, 'b-', linewidth=2, label='Historical')
        ax4.plot(days_pred, cumulative_pred + cumulative_hist[-1], 'r--', linewidth=2, label='Predicted')
        ax4.axvline(x=len(hist_emissions), color='green', linestyle=':', linewidth=2)
        ax4.set_xlabel('Day')
        ax4.set_ylabel('Cumulative CO₂ (kg)')
        ax4.set_title('Cumulative Emission Trajectory')
        ax4.legend()
        ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        # Save
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"emission_analysis_dashboard_{timestamp}.png"
        
        output_path = os.path.join(self.output_dir, filename)
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        print(f"✅ Dashboard saved to: {output_path}")
        
        plt.show()
        
        return output_path


def load_data(historical_path, predicted_path):
    """
    Load historical and predicted data from CSV files.
    
    Args:
        historical_path (str): Path to historical data CSV
        predicted_path (str): Path to predicted data CSV
        
    Returns:
        tuple: (historical_df, predicted_df)
    """
    if not os.path.exists(historical_path):
        raise FileNotFoundError(f"Historical data not found: {historical_path}")
    
    if not os.path.exists(predicted_path):
        raise FileNotFoundError(f"Predicted data not found: {predicted_path}")
    
    historical_df = pd.read_csv(historical_path)
    predicted_df = pd.read_csv(predicted_path)
    
    print(f"📂 Loaded {len(historical_df)} historical records")
    print(f"📂 Loaded {len(predicted_df)} predicted records")
    
    return historical_df, predicted_df


def main():
    """
    Main execution with CLI support.
    """
    parser = argparse.ArgumentParser(
        description="Visualize historical vs predicted emissions"
    )
    
    parser.add_argument(
        '--historical',
        type=str,
        default=None,
        help='Path to historical data CSV'
    )
    
    parser.add_argument(
        '--predicted',
        type=str,
        default=None,
        help='Path to predicted data CSV'
    )
    
    parser.add_argument(
        '--dashboard',
        action='store_true',
        help='Generate detailed statistical dashboard'
    )
    
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("EMISSION VISUALIZATION GENERATOR")
    print("="*60)
    
    # Auto-detect latest prediction file if not specified
    if args.predicted is None:
        predictions_dir = os.path.join(os.path.dirname(__file__), "predictions")
        if os.path.exists(predictions_dir):
            pred_files = [
                f for f in os.listdir(predictions_dir)
                if f.startswith('predicted_emissions_') and f.endswith('.csv')
            ]
            
            if pred_files:
                pred_files.sort(reverse=True)  # Get latest
                args.predicted = os.path.join(predictions_dir, pred_files[0])
                print(f"📁 Auto-detected prediction file: {pred_files[0]}")
            else:
                raise FileNotFoundError(
                    "No prediction file found. Please run predict_future_emissions.py first."
                )
        else:
            raise FileNotFoundError(
                "Predictions folder not found. Please run predict_future_emissions.py first."
            )
    
    # Auto-detect historical data if not specified
    if args.historical is None:
        data_path = os.path.join(
            os.path.dirname(__file__),
            "data",
            "industry_emission_10k.csv"
        )
        
        if os.path.exists(data_path):
            full_data = pd.read_csv(data_path)
            historical_df = full_data.tail(30)
            print(f"📁 Using last 30 days from: data/industry_emission_10k.csv")
        else:
            raise FileNotFoundError("Historical data not found")
    else:
        historical_df = pd.read_csv(args.historical)
    
    # Load predicted data
    predicted_df = pd.read_csv(args.predicted)
    
    # Initialize visualizer
    visualizer = EmissionVisualizer()
    
    # Generate main comparison graph
    comparison_path = visualizer.plot_comparison(historical_df, predicted_df)
    
    # Generate dashboard if requested
    if args.dashboard:
        dashboard_path = visualizer.plot_statistical_summary(historical_df, predicted_df)
    
    print("\n" + "="*60)
    print("✅ VISUALIZATION COMPLETE")
    print("="*60)
    print(f"Comparison Graph: {comparison_path}")
    if args.dashboard:
        print(f"Analysis Dashboard: {dashboard_path}")
    print("\nGraphs saved to: industry_model/representation/")


if __name__ == "__main__":
    main()
