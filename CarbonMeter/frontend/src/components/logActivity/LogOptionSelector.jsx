import React from 'react';
import './LogOptionSelector.css';

const LogOptionSelector = ({ onSelect }) => {
  return (
    <div className="log-option-selector">
      <h2 className="selector-title">Choose Logging Method</h2>
      <p className="selector-subtitle">Select how you want to log your carbon emissions</p>

      <div className="option-cards">
        <button className="option-card" onClick={() => onSelect('manual')}>
          <div className="option-icon">📝</div>
          <h3>Manual Logging</h3>
          <p>Enter detailed activity data for accurate emission calculation</p>
          <ul className="option-features">
            <li>✓ Precise calculations</li>
            <li>✓ Category-wise tracking</li>
            <li>✓ Saved to dashboard</li>
            <li>✓ Government-approved formulas</li>
          </ul>
          <div className="option-badge">Recommended</div>
        </button>

        <button className="option-card automatic" onClick={() => onSelect('automatic')}>
          <div className="option-icon">🚗</div>
          <h3>Automatic Transport</h3>
          <p>Track transport emissions using map and live location</p>
          <ul className="option-features">
            <li>✓ Real distance calculation</li>
            <li>✓ Interactive map</li>
            <li>✓ Real vehicle data</li>
            <li>✓ GPS-based tracking</li>
          </ul>
          <div className="option-badge new">New</div>
        </button>
      </div>

      <div className="info-note">
        <span className="info-icon">ℹ️</span>
        <p>Manual logging provides accurate results based on government emission factors. Automatic transport uses GPS and real vehicle data.</p>
      </div>
    </div>
  );
};

export default LogOptionSelector;
