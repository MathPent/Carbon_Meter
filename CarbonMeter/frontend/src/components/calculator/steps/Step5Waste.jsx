import React from 'react';

const Step5Waste = ({ data, updateData, onNext, onPrev }) => {
  const wasteOptions = [
    { 
      value: 'low', 
      label: 'Low', 
      icon: '♻️',
      description: 'I recycle, compost, and minimize waste'
    },
    { 
      value: 'average', 
      label: 'Average', 
      icon: '🗑️',
      description: 'Similar to most people around me'
    },
    { 
      value: 'high', 
      label: 'High', 
      icon: '📦',
      description: 'I generate more waste than most'
    }
  ];

  return (
    <div className="step-content step-waste">
      <div className="step-animation">
        <div className="waste-icon">♻️</div>
      </div>
      
      <h2 className="step-title">How about waste?</h2>
      <p className="step-description">
        Waste in landfills produces methane, a powerful greenhouse gas. 
        Reducing, reusing, and recycling can make a real difference!
      </p>

      <div className="form-group">
        <label>Compared to others around you, how much waste do you generate?</label>
        <div className="option-grid">
          {wasteOptions.map(option => (
            <button
              key={option.value}
              className={`option-card ${data.wasteLevel === option.value ? 'selected' : ''}`}
              onClick={() => updateData('wasteLevel', option.value)}
            >
              <span className="option-icon">{option.icon}</span>
              <span className="option-label">{option.label}</span>
              <span className="option-description">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="info-box">
        <h4>🌟 Quick tips to reduce waste emissions:</h4>
        <ul>
          <li>Compost food scraps instead of throwing them away</li>
          <li>Use reusable bags, bottles, and containers</li>
          <li>Buy products with minimal packaging</li>
          <li>Repair items instead of replacing them</li>
        </ul>
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

export default Step5Waste;
