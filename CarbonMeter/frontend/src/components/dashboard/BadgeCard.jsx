import React, { useState } from 'react';
import './BadgeCard.css';

const BadgeCard = ({ badge, isUnlocked, emissionValue }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div 
      className={`badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}
      title={isUnlocked ? badge.unlockedTooltip : badge.lockedTooltip}
    >
      {/* Badge Image Container */}
      <div className="badge-image-wrapper">
        {!imageError ? (
          <img
            src={badge.image}
            alt={badge.name}
            className="badge-image"
            onError={handleImageError}
          />
        ) : (
          <div className="badge-image-fallback">
            <span className="fallback-emoji">🏅</span>
          </div>
        )}
        
        {/* Lock Icon Overlay for Locked Badges */}
        {!isUnlocked && (
          <div className="lock-overlay">
            <span className="lock-icon">🔒</span>
          </div>
        )}

        {/* Glow Effect for Unlocked Badges */}
        {isUnlocked && (
          <div className="glow-effect"></div>
        )}
      </div>

      {/* Badge Info */}
      <div className="badge-info">
        <h4 className="badge-name">{badge.name}</h4>
        <p className="badge-description">{badge.description}</p>
        
        {/* Emission Context */}
        {emissionValue !== undefined && emissionValue !== null && (
          <div className="emission-context">
            <span className="emission-label">Current:</span>
            <span className="emission-value">{emissionValue.toFixed(2)} tCO₂e</span>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="badge-status">
        {isUnlocked ? (
          <span className="status-badge unlocked-status">✓ Unlocked</span>
        ) : (
          <span className="status-badge locked-status">🔒 Locked</span>
        )}
      </div>
    </div>
  );
};

export default BadgeCard;
