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

        <button className="option-card" onClick={() => onSelect('quick')}>
          <div className="option-icon">⚡</div>
          <h3>Quick Footprint Estimator</h3>
          <p>Get a fast estimate by describing your activity</p>
          <ul className="option-features">
            <li>✓ Fast estimation</li>
            <li>✓ Text-based input</li>
            <li>✓ Approximate results</li>
            <li>✓ No save unless confirmed</li>
          </ul>
          <div className="option-badge secondary">Quick Mode</div>
        </button>
      </div>

      <div className="info-note">
        <span className="info-icon">ℹ️</span>
        <p>Manual logging provides accurate results based on government emission factors. Quick estimator gives approximate values.</p>
      </div>
    </div>
  );
};

export default LogOptionSelector;
