import React from 'react';

const Step3Housing = ({ data, updateData, updateMultiple, onNext, onPrev }) => {
  const housingOptions = [
    { value: 'independentHouse', label: 'Independent House', icon: '🏠' },
    { value: 'apartment', label: 'Apartment', icon: '🏢' },
    { value: 'sharedHousing', label: 'Shared Housing', icon: '🏘️' }
  ];

  const efficiencyOptions = [
    { value: 'low', label: 'Low', description: 'Poor insulation, old appliances' },
    { value: 'medium', label: 'Medium', description: 'Standard efficiency' },
    { value: 'high', label: 'High', description: 'Energy-efficient appliances, good insulation' }
  ];

  return (
    <div className="step-content step-housing">
      <div className="step-animation">
        <div className="housing-icon">🏡</div>
      </div>
      
      <h2 className="step-title">Tell us about your home</h2>
      <p className="step-description">
        Your housing type and energy efficiency affect your carbon footprint significantly.
      </p>

      <div className="form-group">
        <label>Housing Type</label>
        <div className="option-grid">
          {housingOptions.map(option => (
            <button
              key={option.value}
              className={`option-card ${data.housingType === option.value ? 'selected' : ''}`}
              onClick={() => updateData('housingType', option.value)}
            >
              <span className="option-icon">{option.icon}</span>
              <span className="option-label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="householdSize">
          Number of people in your household: <strong>{data.householdSize}</strong>
        </label>
        <input
          type="number"
          id="householdSize"
          min="1"
          max="15"
          value={data.householdSize}
          onChange={(e) => updateData('householdSize', parseInt(e.target.value) || 1)}
          className="number-input"
        />
      </div>

      <div className="form-group">
        <label>Energy Efficiency Level</label>
        <div className="radio-group">
          {efficiencyOptions.map(option => (
            <label
              key={option.value}
              className={`radio-option ${data.energyEfficiency === option.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="efficiency"
                value={option.value}
                checked={data.energyEfficiency === option.value}
                onChange={(e) => updateData('energyEfficiency', e.target.value)}
              />
              <div className="radio-content">
                <strong>{option.label}</strong>
                <p>{option.description}</p>
              </div>
            </label>
          ))}
        </div>
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

export default Step3Housing;
