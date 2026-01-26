import React, { useMemo } from 'react';
import badgesConfig from '../../config/badgesConfig';
import BadgeCard from './BadgeCard';
import './BadgesSection.css';

const BadgesSection = ({ emissionData }) => {
  // Calculate badge unlock states
  const badgeStates = useMemo(() => {
    return badgesConfig.map(badge => ({
      ...badge,
      isUnlocked: badge.unlockCondition(emissionData),
    }));
  }, [emissionData]);

  // Count unlocked badges
  const unlockedCount = badgeStates.filter(b => b.isUnlocked).length;
  const totalCount = badgeStates.length;
  const unlockedPercentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <section className="badges-section">
      {/* Section Header */}
      <div className="badges-header">
        <div className="badges-title-group">
          <h2 className="badges-title">🏅 Carbon Status & Badges</h2>
          <p className="badges-subtitle">Earn badges by reducing your carbon footprint</p>
        </div>
        
        {/* Progress Stats */}
        <div className="badges-stats">
          <div className="stat-item">
            <span className="stat-label">Unlocked</span>
            <span className="stat-value">{unlockedCount}/{totalCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Progress</span>
            <span className="stat-value progress-bar-container">
              <span className="progress-fill" style={{ width: `${unlockedPercentage}%` }}></span>
              <span className="progress-text">{unlockedPercentage}%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Achievement Summary */}
      <div className="achievement-summary">
        {unlockedCount > 0 && (
          <div className="achievement-message success">
            <span className="achievement-icon">🎉</span>
            <div className="achievement-text">
              <strong>Excellent Progress!</strong>
              <p>You've unlocked {unlockedCount} badge{unlockedCount !== 1 ? 's' : ''}. Keep reducing your emissions!</p>
            </div>
          </div>
        )}
        
        {unlockedCount === 0 && (
          <div className="achievement-message info">
            <span className="achievement-icon">🌱</span>
            <div className="achievement-text">
              <strong>Start Your Journey</strong>
              <p>Reduce your carbon emissions to unlock badges and track your progress towards sustainability.</p>
            </div>
          </div>
        )}
      </div>

      {/* Badges Grid */}
      <div className="badges-grid">
        {badgeStates.map((badge) => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            isUnlocked={badge.isUnlocked}
            emissionValue={emissionData?.totalEmissions}
          />
        ))}
      </div>

      {/* Footer Info */}
      <div className="badges-footer">
        <div className="footer-info">
          <p className="footer-title">How Badges Work</p>
          <ul className="footer-list">
            <li>🔒 <strong>Locked badges</strong> motivate you to reduce emissions</li>
            <li>✓ <strong>Unlocked badges</strong> celebrate your sustainability achievements</li>
            <li>📊 <strong>Thresholds</strong> are based on Indian emission standards</li>
            <li>⚡ <strong>Real-time tracking</strong> - badges update as your emissions change</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default BadgesSection;
