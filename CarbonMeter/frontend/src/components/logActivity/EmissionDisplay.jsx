import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import './EmissionDisplay.css';

const EmissionDisplay = ({ category, data, emission, onReset, onBack }) => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Provide default category if undefined
  const effectiveCategory = category || 'general';

  const normalizeCategoryKey = (value) => (value || '').toString().trim().toLowerCase();
  
  // Provide default emission value if undefined or invalid
  const effectiveEmission = (emission !== undefined && emission !== null && !isNaN(emission)) 
    ? parseFloat(emission) 
    : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('Please login first');
        navigate('/login');
        return;
      }
      
      // Format data for backend
      const categoryMap = {
        transport: 'Transport',
        electricity: 'Electricity',
        food: 'Food',
        waste: 'Waste',
      };

      const normalizedCategory = normalizeCategoryKey(effectiveCategory) || 'transport';
      const apiCategory = categoryMap[normalizedCategory];

      if (!apiCategory) {
        alert('Unsupported activity category. Please try again.');
        setSaving(false);
        return;
      }

      const activityPayload = {
        category: apiCategory,
        logType: 'manual',
        description: data.description || `${effectiveCategory} activity`,
        carbonEmission: effectiveEmission,
        data: normalizedCategory === 'transport' ? {
          mode: data.transportType,
          vehicleType: data.vehicleType,
          fuelType: data.fuelType,
          distance: parseFloat(data.distance),
          mileage: data.mileage ? parseFloat(data.mileage) : null,
          fuelConsumed: data.breakdown?.fuelConsumed ? parseFloat(data.breakdown.fuelConsumed) : null
        } : normalizedCategory === 'electricity' ? {
          source: data.electricitySource || data.source || 'grid',
          consumption: parseFloat(data.consumption || data.breakdown?.consumption || 0)
        } : normalizedCategory === 'food' ? {
          type: data.foodType,
          items: data.items || []
        } : normalizedCategory === 'waste' ? {
          foodWaste: parseFloat(data.foodWaste || 0),
          solidWaste: parseFloat(data.solidWaste || 0),
          liquidWaste: parseFloat(data.liquidWaste || 0)
        } : {},
        formula: data.formula || '',
        source: data.source || ''
      };

      console.log('Sending activity payload:', activityPayload);

      const response = await api.post('/activities/log-manual', activityPayload);

      if (response.data.success) {
        setSaved(true);
        alert('Activity logged successfully! ✅');
        // Navigate to dashboard to refresh data
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
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
          {effectiveCategory === 'transport' && '🚗'}
          {effectiveCategory === 'electricity' && '⚡'}
          {effectiveCategory === 'food' && '🍽️'}
          {effectiveCategory === 'waste' && '🗑️'}
          {effectiveCategory === 'general' && '🌍'}
        </div>
        <div className="emission-value">
          <span className="value-number">{effectiveEmission.toFixed(2)}</span>
          <span className="value-unit">kg CO₂</span>
        </div>
        <div className="emission-category">{effectiveCategory.toUpperCase()} EMISSIONS</div>
      </div>

      {/* Breakdown Section */}
      <div className="emission-breakdown">
        <h3>Calculation Breakdown</h3>
        
        {/* Transport Breakdown */}
        {effectiveCategory === 'transport' && data.breakdown && (
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
        {effectiveCategory === 'electricity' && data.breakdown && (
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
        {effectiveCategory === 'food' && data.items && (
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
        {effectiveCategory === 'waste' && data.breakdown && (
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
