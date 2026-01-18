import React from 'react';

const Step2Electricity = ({ data, updateData, onNext, onPrev }) => {
  return (
    <div className="step-content step-electricity">
      <div className="step-animation">
        <div className="electricity-icon">⚡</div>
      </div>
      
      <h2 className="step-title">Let's talk about electricity</h2>
      <p className="step-description">
        Did you know that electricity use contributes directly to CO₂ emissions?
        Most electricity comes from fossil fuels like coal and natural gas.
      </p>

      <div className="form-group">
        <label htmlFor="electricity">
          Monthly Electricity Usage: <strong>{data.electricityUsage} kWh</strong>
        </label>
        <p className="helper-text">
          💡 Tip: Check your electricity bill. Average household uses 200-500 kWh/month
        </p>
        <input
          type="range"
          id="electricity"
          min="0"
          max="1000"
          step="10"
          value={data.electricityUsage}
          onChange={(e) => updateData('electricityUsage', parseInt(e.target.value))}
          className="slider"
        />
        <div className="slider-labels">
          <span>0 kWh</span>
          <span>500 kWh</span>
          <span>1000 kWh</span>
        </div>
      </div>

      <div className="info-box">
        <p>
          <strong>Estimated CO₂:</strong> {(data.electricityUsage * 0.82).toFixed(1)} kg/month
        </p>
        <p className="info-note">
          Formula: kWh × 0.82 = kg CO₂
        </p>
      </div>

      <div className="button-group">
        <button className="btn-secondary" onClick={onPrev}>
          ← Back
        </button>
        <button className="btn-primary" onClick={onNext}>
          Continue →
        </button>
      </div>
    </div>
  );
};

export default Step2Electricity;
