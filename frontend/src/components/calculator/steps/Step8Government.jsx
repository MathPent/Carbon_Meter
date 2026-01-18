import React from 'react';

const Step8Government = ({ data, updateData, updateMultiple, onNext, onPrev }) => {
  const facilityOptions = [
    { value: 'office', label: 'Govt Office', icon: '🏢' },
    { value: 'hospital', label: 'Govt Hospital', icon: '🏥' },
    { value: 'transport', label: 'Public Transport Hub', icon: '🚉' },
    { value: 'none', label: 'None / Rarely', icon: '🚫' }
  ];

  const handleFacilitySelect = (facility) => {
    if (facility === 'none') {
      updateMultiple({
        usesGovFacility: false,
        govFacilityType: 'none',
        govFacilityElectricity: 0
      });
    } else {
      updateMultiple({
        usesGovFacility: true,
        govFacilityType: facility
      });
    }
  };

  return (
    <div className="step-content step-government">
      <div className="step-animation">
        <div className="government-icon">🏛️</div>
      </div>
      
      <h2 className="step-title">Government facilities</h2>
      <p className="step-description">
        This is a limited estimate. If you frequently use government facilities, 
        your indirect footprint includes a small share of their operations.
      </p>

      <div className="form-group">
        <label>Do you frequently use government facilities?</label>
        <div className="option-grid">
          {facilityOptions.map(option => (
            <button
              key={option.value}
              className={`option-card ${data.govFacilityType === option.value ? 'selected' : ''}`}
              onClick={() => handleFacilitySelect(option.value)}
            >
              <span className="option-icon">{option.icon}</span>
              <span className="option-label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {data.usesGovFacility && data.govFacilityType !== 'none' && (
        <div className="form-group">
          <label htmlFor="govElectricity">
            Estimated monthly electricity usage of facility: <strong>{data.govFacilityElectricity} kWh</strong>
          </label>
          <p className="helper-text">
            This is optional and just an estimate. Typical large facilities use 5,000-20,000 kWh/month
          </p>
          <input
            type="range"
            id="govElectricity"
            min="0"
            max="30000"
            step="500"
            value={data.govFacilityElectricity}
            onChange={(e) => updateData('govFacilityElectricity', parseInt(e.target.value))}
            className="slider"
          />
          <div className="slider-labels">
            <span>0</span>
            <span>15,000</span>
            <span>30,000 kWh</span>
          </div>
        </div>
      )}

      <div className="info-box">
        <p>
          ℹ️ <strong>Note:</strong> We estimate you account for about 5-10% of the facility's 
          emissions based on your usage frequency. This is a rough approximation.
        </p>
      </div>

      <div className="button-group">
        <button className="btn-secondary" onClick={onPrev}>
          ← Back
        </button>
        <button className="btn-primary" onClick={onNext}>
          See My Results 🌟
        </button>
      </div>
    </div>
  );
};

export default Step8Government;
