import React from 'react';

const Step7PublicTransport = ({ data, updateData, updateMultiple, onNext, onPrev }) => {
  const flightOptions = [
    { value: 'none', label: 'None', icon: '🏠' },
    { value: '1-2', label: '1-2 flights', icon: '✈️' },
    { value: '3-5', label: '3-5 flights', icon: '✈️✈️' },
    { value: '5+', label: '5+ flights', icon: '✈️✈️✈️' }
  ];

  return (
    <div className="step-content step-public-transport">
      <div className="step-animation">
        <div className="public-transport-icon">🚌</div>
      </div>
      
      <h2 className="step-title">Public transport & flights</h2>
      <p className="step-description">
        Public transport is much more efficient than personal vehicles. 
        But air travel has a significant climate impact!
      </p>

      <div className="form-group">
        <label htmlFor="publicDistance">
          Weekly distance by public transport: <strong>{data.publicTransportDistance} km</strong>
        </label>
        <p className="helper-text">
          Include buses, trains, metro, shared auto/taxi
        </p>
        <input
          type="range"
          id="publicDistance"
          min="0"
          max="300"
          step="5"
          value={data.publicTransportDistance}
          onChange={(e) => updateData('publicTransportDistance', parseInt(e.target.value))}
          className="slider"
        />
        <div className="slider-labels">
          <span>0 km</span>
          <span>150 km</span>
          <span>300 km</span>
        </div>
      </div>

      <div className="form-group">
        <label>How many flights do you take per year?</label>
        <div className="option-grid">
          {flightOptions.map(option => (
            <button
              key={option.value}
              className={`option-card ${data.flightFrequency === option.value ? 'selected' : ''}`}
              onClick={() => updateData('flightFrequency', option.value)}
            >
              <span className="option-icon">{option.icon}</span>
              <span className="option-label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="info-box">
        <p>
          ✈️ <strong>Flight fact:</strong> A single round-trip flight can emit more CO₂ 
          than many people produce in months of ground transportation!
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

export default Step7PublicTransport;
