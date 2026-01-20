import React, { useState } from 'react';
import '../modules/ModuleStyles.css';

const ElectricityModule = ({ onCalculate, onBack }) => {
  const [consumption, setConsumption] = useState('');
  const [source, setSource] = useState('grid');
  const [loading, setLoading] = useState(false);

  // Emission Factor: 0.82 kg CO2 per kWh (CEA India Grid Average)
  const emissionFactor = 0.82;

  const calculateEmission = () => {
    setLoading(true);

    const consump = parseFloat(consumption);
    if (!consump || consump <= 0) {
      alert('Please enter valid electricity consumption');
      setLoading(false);
      return;
    }

    // Formula: CO2 = Electricity (kWh) × 0.82
    const emission = consump * emissionFactor;

    const formula = `CO₂ Emission = ${consump} kWh × ${emissionFactor} kg/kWh = ${emission.toFixed(2)} kg CO₂`;
    
    const sourceLabels = {
      grid: 'Grid (Mixed)',
      dg: 'Diesel Generator',
      renewable: 'Renewable (Solar/Wind)'
    };

    const data = {
      category: 'electricity',
      description: `${consump} kWh electricity consumption from ${sourceLabels[source]}`,
      consumption: consump,
      source,
      emissionFactor,
      emission: emission.toFixed(2),
      formula,
      breakdown: {
        consumption: consump,
        emissionFactor,
        source
      },
      source: 'Central Electricity Authority (CEA)'
    };

    setTimeout(() => {
      setLoading(false);
      onCalculate(data, emission);
    }, 500);
  };

  return (
    <div className="electricity-module">
      <h2 className="module-title">⚡ Electricity Emissions</h2>
      <p className="module-subtitle">Calculate emissions from electricity consumption</p>

      <div className="form-section">
        <label className="form-label">Electricity Source *</label>
        <select
          className="form-input"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="grid">Grid (Mixed)</option>
          <option value="dg">Diesel Generator</option>
          <option value="renewable">Renewable (Solar/Wind)</option>
        </select>
      </div>

      <div className="form-section">
        <label className="form-label">Electricity Consumption (kWh) *</label>
        <input
          type="number"
          className="form-input"
          placeholder="Enter consumption in kWh"
          value={consumption}
          onChange={(e) => setConsumption(e.target.value)}
          min="0"
          step="0.1"
        />
      </div>

      <div className="info-box">
        <span className="info-icon">ℹ️</span>
        <div>
          <strong>Formula:</strong> CO₂ = Electricity (kWh) × 0.82
          <br />
          <strong>Grid Emission Factor:</strong> 0.82 kg CO₂ per kWh (India average)
          <br />
          <strong>Source:</strong> Central Electricity Authority (CEA)
          <br />
          <em>Note: Check your electricity bill for monthly kWh consumption</em>
        </div>
      </div>

      <div className="module-actions">
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button
          className="btn-primary"
          onClick={calculateEmission}
          disabled={loading}
        >
          {loading ? 'Calculating...' : 'Calculate Emission →'}
        </button>
      </div>
    </div>
  );
};

export default ElectricityModule;
