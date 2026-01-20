import React, { useState } from 'react';
import axios from 'axios';
import './EmissionDisplay.css';

const EmissionDisplay = ({ category, data, emission, onReset, onBack }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Format data for backend
      const categoryMap = {
        'transport': 'Transport',
        'electricity': 'Electricity',
        'food': 'Food',
        'waste': 'Waste'
      };

      const activityPayload = {
        category: categoryMap[category] || 'Transport',
        logType: 'manual',
        description: data.description || `${category} activity`,
        carbonEmission: parseFloat(emission),
        data: category === 'transport' ? {
          mode: data.transportType,
          vehicleType: data.vehicleType,
          fuelType: data.fuelType,
          distance: parseFloat(data.distance),
          mileage: data.mileage ? parseFloat(data.mileage) : null,
          fuelConsumed: data.breakdown?.fuelConsumed ? parseFloat(data.breakdown.fuelConsumed) : null
        } : category === 'electricity' ? {
          source: data.source,
          consumption: parseFloat(data.breakdown?.consumption || 0)
        } : category === 'food' ? {
          type: data.foodType,
          items: data.items || []
        } : category === 'waste' ? {
          foodWaste: parseFloat(data.foodWaste || 0),
          solidWaste: parseFloat(data.solidWaste || 0),
          liquidWaste: parseFloat(data.liquidWaste || 0)
        } : {},
        formula: data.formula || '',
        source: data.source || ''
      };

      console.log('Sending activity payload:', activityPayload);

      const response = await axios.post(
        'http://localhost:5000/api/activities/log-manual',
        activityPayload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSaved(true);
        alert('Activity logged successfully! ✅');
        // Trigger dashboard update
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to save activity. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="emission-display">
      <div className="emission-success-header">
        <div className="success-icon">✅</div>
        <h2>Emission Calculated</h2>
        <p>Review your carbon footprint</p>
      </div>

      {/* Main Emission Value */}
      <div className="emission-result-card">
        <div className="emission-icon">
          {category === 'transport' && '🚗'}
          {category === 'electricity' && '⚡'}
          {category === 'food' && '🍽️'}
          {category === 'waste' && '🗑️'}
        </div>
        <div className="emission-value">
          <span className="value-number">{parseFloat(emission).toFixed(2)}</span>
          <span className="value-unit">kg CO₂</span>
        </div>
        <div className="emission-category">{category.toUpperCase()} EMISSIONS</div>
      </div>

      {/* Breakdown Section */}
      <div className="emission-breakdown">
        <h3>Calculation Breakdown</h3>
        
        {/* Transport Breakdown */}
        {category === 'transport' && data.breakdown && (
          <div className="breakdown-details">
            <div className="breakdown-item">
              <span className="label">Transport Type:</span>
              <span className="value">{data.transportType}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">Vehicle/Mode:</span>
              <span className="value">{data.vehicleType}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">Fuel Type:</span>
              <span className="value">{data.fuelType}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">Distance:</span>
              <span className="value">{data.distance} km</span>
            </div>
            {data.breakdown.fuelConsumed && (
              <div className="breakdown-item">
                <span className="label">Fuel Consumed:</span>
                <span className="value">{data.breakdown.fuelConsumed} L/kg</span>
              </div>
            )}
            <div className="breakdown-item highlight">
              <span className="label">Emission Factor:</span>
              <span className="value">{data.breakdown.emissionFactor} kg CO₂/unit</span>
            </div>
          </div>
        )}

        {/* Electricity Breakdown */}
        {category === 'electricity' && data.breakdown && (
          <div className="breakdown-details">
            <div className="breakdown-item">
              <span className="label">Source:</span>
              <span className="value">{data.source}</span>
            </div>
            <div className="breakdown-item">
              <span className="label">Consumption:</span>
              <span className="value">{data.consumption} kWh</span>
            </div>
            <div className="breakdown-item highlight">
              <span className="label">Emission Factor:</span>
              <span className="value">{data.emissionFactor} kg CO₂/kWh</span>
            </div>
          </div>
        )}

        {/* Food Breakdown */}
        {category === 'food' && data.items && (
          <div className="breakdown-details">
            {data.items.map((item, index) => (
              <div key={index} className="breakdown-item">
                <span className="label">{item.item}:</span>
                <span className="value">{item.quantity} kg × {item.ef} = {item.emission} kg CO₂</span>
              </div>
            ))}
          </div>
        )}

        {/* Waste Breakdown */}
        {category === 'waste' && data.breakdown && (
          <div className="breakdown-details">
            {data.foodWaste > 0 && (
              <div className="breakdown-item">
                <span className="label">Food Waste:</span>
                <span className="value">{data.foodWaste} kg × 2.5 = {data.breakdown.foodWaste.emission} kg CO₂e</span>
              </div>
            )}
            {data.solidWaste > 0 && (
              <div className="breakdown-item">
                <span className="label">Solid Waste:</span>
                <span className="value">{data.solidWaste} kg × 1.9 = {data.breakdown.solidWaste.emission} kg CO₂e</span>
              </div>
            )}
            {data.liquidWaste > 0 && (
              <div className="breakdown-item">
                <span className="label">Liquid Waste:</span>
                <span className="value">{data.liquidWaste} kg × 1.9 = {data.breakdown.liquidWaste.emission} kg CO₂e</span>
              </div>
            )}
          </div>
        )}

        {/* Formula Display */}
        {data.formula && (
          <div className="formula-box">
            <h4>📐 Formula Used:</h4>
            <pre>{data.formula}</pre>
          </div>
        )}

        {/* Source Reference */}
        <div className="source-reference">
          <strong>📚 Data Source:</strong> {data.source}
        </div>
      </div>

      {/* Actions */}
      <div className="emission-actions">
        <button className="btn-secondary" onClick={onBack} disabled={saving || saved}>
          ← Edit
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={saving || saved}>
          {saving ? 'Saving...' : saved ? 'Saved ✓' : '💾 Save to Dashboard'}
        </button>
        <button className="btn-tertiary" onClick={onReset} disabled={saving}>
          🔄 Log New Activity
        </button>
      </div>
    </div>
  );
};

export default EmissionDisplay;
