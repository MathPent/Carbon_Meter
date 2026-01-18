import React from 'react';

const Step6Transport = ({ data, updateData, updateMultiple, onNext, onPrev }) => {
  const fuelOptions = [
    { value: 'petrol', label: 'Petrol', icon: '⛽' },
    { value: 'diesel', label: 'Diesel', icon: '🚗' },
    { value: 'cng', label: 'CNG', icon: '🚙' },
    { value: 'electric', label: 'Electric', icon: '🔋' }
  ];

  return (
    <div className="step-content step-transport">
      <div className="step-animation">
        <div className="transport-icon">🚗</div>
      </div>
      
      <h2 className="step-title">Let's talk about personal transport</h2>
      <p className="step-description">
        Transportation is one of the largest sources of carbon emissions. 
        Every kilometer matters!
      </p>

      <div className="form-group">
        <label htmlFor="personalDistance">
          Weekly distance by personal vehicle: <strong>{data.personalTransportDistance} km</strong>
        </label>
        <p className="helper-text">
          Include cars, motorcycles, scooters you drive or own
        </p>
        <input
          type="range"
          id="personalDistance"
          min="0"
          max="500"
          step="5"
          value={data.personalTransportDistance}
          onChange={(e) => updateData('personalTransportDistance', parseInt(e.target.value))}
          className="slider"
        />
        <div className="slider-labels">
          <span>0 km</span>
          <span>250 km</span>
          <span>500 km</span>
        </div>
      </div>

      {data.personalTransportDistance > 0 && (
        <>
          <div className="form-group">
            <label>What fuel does your vehicle use?</label>
            <div className="option-grid">
              {fuelOptions.map(option => (
                <button
                  key={option.value}
                  className={`option-card ${data.fuelType === option.value ? 'selected' : ''}`}
                  onClick={() => updateData('fuelType', option.value)}
                >
                  <span className="option-icon">{option.icon}</span>
                  <span className="option-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Do you usually travel alone or with others?</label>
            <div className="toggle-group">
              <button
                className={`toggle-option ${!data.isSharedTransport ? 'selected' : ''}`}
                onClick={() => updateData('isSharedTransport', false)}
              >
                Solo 🚶
              </button>
              <button
                className={`toggle-option ${data.isSharedTransport ? 'selected' : ''}`}
                onClick={() => updateData('isSharedTransport', true)}
              >
                Shared 👥
              </button>
            </div>
          </div>
        </>
      )}

      <div className="info-box">
        <p>
          💡 <strong>Pro tip:</strong> Carpooling can cut your transport emissions in half!
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

export default Step6Transport;
