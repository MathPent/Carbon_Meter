import React, { useState } from 'react';
import '../modules/ModuleStyles.css';

const WasteModule = ({ onCalculate, onBack }) => {
  const [foodWaste, setFoodWaste] = useState('');
  const [solidWaste, setSolidWaste] = useState('');
  const [liquidWaste, setLiquidWaste] = useState('');
  const [loading, setLoading] = useState(false);

  // Emission Factors
  const foodWasteEF = 2.5; // kg CO2e per kg
  const otherWasteEF = 1.9; // kg CO2e per kg

  const calculateEmission = () => {
    setLoading(true);

    const fw = parseFloat(foodWaste) || 0;
    const sw = parseFloat(solidWaste) || 0;
    const lw = parseFloat(liquidWaste) || 0;

    if (fw === 0 && sw === 0 && lw === 0) {
      alert('Please enter at least one waste quantity');
      setLoading(false);
      return;
    }

    // Formula: Food Waste = 2.5 kg CO2e/kg, Other Waste = 1.9 kg CO2e/kg
    const foodWasteEmission = fw * foodWasteEF;
    const solidWasteEmission = sw * otherWasteEF;
    const liquidWasteEmission = lw * otherWasteEF;
    const totalEmission = foodWasteEmission + solidWasteEmission + liquidWasteEmission;

    let formula = 'Formula:\n';
    if (fw > 0) formula += `Food Waste: ${fw} kg × ${foodWasteEF} = ${foodWasteEmission.toFixed(2)} kg CO₂e\n`;
    if (sw > 0) formula += `Solid Waste: ${sw} kg × ${otherWasteEF} = ${solidWasteEmission.toFixed(2)} kg CO₂e\n`;
    if (lw > 0) formula += `Liquid Waste: ${lw} kg × ${otherWasteEF} = ${liquidWasteEmission.toFixed(2)} kg CO₂e\n`;
    formula += `\nTotal: ${totalEmission.toFixed(2)} kg CO₂e`;

    const data = {
      category: 'waste',
      foodWaste: fw,
      solidWaste: sw,
      liquidWaste: lw,
      emission: totalEmission.toFixed(2),
      breakdown: {
        foodWaste: { quantity: fw, ef: foodWasteEF, emission: foodWasteEmission.toFixed(2) },
        solidWaste: { quantity: sw, ef: otherWasteEF, emission: solidWasteEmission.toFixed(2) },
        liquidWaste: { quantity: lw, ef: otherWasteEF, emission: liquidWasteEmission.toFixed(2) }
      },
      formula,
      source: 'IPCC, MoEFCC India'
    };

    setTimeout(() => {
      setLoading(false);
      onCalculate(data, totalEmission);
    }, 500);
  };

  return (
    <div className="waste-module">
      <h2 className="module-title">🗑️ Waste Emissions</h2>
      <p className="module-subtitle">Calculate emissions from waste generation</p>

      <div className="form-section">
        <label className="form-label">Food Waste (kg)</label>
        <input
          type="number"
          className="form-input"
          placeholder="Enter food waste quantity"
          value={foodWaste}
          onChange={(e) => setFoodWaste(e.target.value)}
          min="0"
          step="0.1"
        />
        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
          EF: 2.5 kg CO₂e per kg
        </p>
      </div>

      <div className="form-section">
        <label className="form-label">Solid Waste (kg)</label>
        <input
          type="number"
          className="form-input"
          placeholder="Enter solid waste quantity"
          value={solidWaste}
          onChange={(e) => setSolidWaste(e.target.value)}
          min="0"
          step="0.1"
        />
        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
          EF: 1.9 kg CO₂e per kg
        </p>
      </div>

      <div className="form-section">
        <label className="form-label">Liquid Waste (kg)</label>
        <input
          type="number"
          className="form-input"
          placeholder="Enter liquid waste quantity"
          value={liquidWaste}
          onChange={(e) => setLiquidWaste(e.target.value)}
          min="0"
          step="0.1"
        />
        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
          EF: 1.9 kg CO₂e per kg
        </p>
      </div>

      <div className="info-box">
        <span className="info-icon">ℹ️</span>
        <div>
          <strong>Formula:</strong> CO₂e = Waste (kg) × Emission Factor
          <br />
          <strong>Food Waste EF:</strong> 2.5 kg CO₂e/kg
          <br />
          <strong>Other Waste EF:</strong> 1.9 kg CO₂e/kg
          <br />
          <strong>Source:</strong> IPCC, MoEFCC India
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

export default WasteModule;
