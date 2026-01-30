import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BadgesPage.css';
import API_BASE_URL from '../config/api.config';

const BadgesPage = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/badges/available`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setBadges(response.data.badges);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (badgeName) => {
    const icons = {
      'First Step': '🌱',
      'Eco Warrior': '⚔️',
      'Carbon Conscious': '🌍',
      'Green Champion': '🏆',
      'Low Carbon Hero': '🦸',
      'Consistency King': '👑',
      'Multi-Category Master': '🎯',
    };
    return icons[badgeName] || '🏅';
  };

  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  return (
    <div className="badges-page">
      <div className="badges-container">
        <div className="badges-header">
          <h1 className="badges-title">🏆 My Achievements</h1>
          <p className="badges-subtitle">
            Unlock badges by completing challenges and logging activities
          </p>
        </div>

        {/* Stats */}
        <div className="badges-stats">
          <div className="stat-box">
            <div className="stat-number">{earnedBadges.length}</div>
            <div className="stat-label">Badges Earned</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{lockedBadges.length}</div>
            <div className="stat-label">Badges to Unlock</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">
              {badges.length > 0 
                ? Math.round((earnedBadges.length / badges.length) * 100)
                : 0}%
            </div>
            <div className="stat-label">Completion</div>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading badges...</div>
        ) : (
          <>
            {/* Earned Badges */}
            {earnedBadges.length > 0 && (
              <div className="badges-section">
                <h2 className="section-title">✨ Earned Badges</h2>
                <div className="badges-grid">
                  {earnedBadges.map((badge) => (
                    <div key={badge.name} className="badge-card earned">
                      <div className="badge-icon">{getBadgeIcon(badge.name)}</div>
                      <h3 className="badge-name">{badge.name}</h3>
                      <p className="badge-description">{badge.description}</p>
                      <div className="badge-earned-date">
                        Earned {new Date(badge.earnedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked Badges */}
            {lockedBadges.length > 0 && (
              <div className="badges-section">
                <h2 className="section-title">🔒 Locked Badges</h2>
                <div className="badges-grid">
                  {lockedBadges.map((badge) => (
                    <div key={badge.name} className="badge-card locked">
                      <div className="badge-icon locked-icon">🔒</div>
                      <h3 className="badge-name">{badge.name}</h3>
                      <p className="badge-description">{badge.description}</p>
                      <div className="badge-hint">Complete the challenge to unlock!</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {badges.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🏅</div>
                <h3>Start Your Journey</h3>
                <p>Begin logging activities to earn your first badge!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BadgesPage;
