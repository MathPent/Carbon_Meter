import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LeaderboardPage.css';
import API_BASE_URL from '../config/api.config';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState('monthly'); // all, monthly, weekly
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      // Try both token keys for compatibility
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to view the leaderboard');
        navigate('/auth');
        return;
      }
      
      console.log('Fetching leaderboard with period:', period);
      console.log('Using token:', token.substring(0, 20) + '...');
      
      const response = await axios.get(`${API_BASE_URL}/api/activities/leaderboard?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Leaderboard response:', response.data);
      if (response.data.success) {
        setLeaderboard(response.data.leaderboard || []);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        setTimeout(() => navigate('/auth'), 2000);
      } else {
        setError(error.response?.data?.message || 'Failed to load leaderboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <h1 className="leaderboard-title">🏆 Community Leaderboard</h1>
          <p className="leaderboard-subtitle">
            Compete with others to achieve the lowest carbon footprint!
          </p>
        </div>

        {/* Period Filter */}
        <div className="period-filter">
          <button
            className={`period-btn ${period === 'weekly' ? 'active' : ''}`}
            onClick={() => setPeriod('weekly')}
          >
            This Week
          </button>
          <button
            className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
            onClick={() => setPeriod('monthly')}
          >
            This Month
          </button>
          <button
            className={`period-btn ${period === 'all' ? 'active' : ''}`}
            onClick={() => setPeriod('all')}
          >
            All Time
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message" style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Leaderboard Table */}
        {loading ? (
          <div className="loading">Loading leaderboard...</div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌱</div>
            <h3>No data available yet</h3>
            <p>Be the first to log activities and appear on the leaderboard!</p>
          </div>
        ) : (
          <div className="leaderboard-table">
            <div className="table-header">
              <div className="header-rank">Rank</div>
              <div className="header-user">User</div>
              <div className="header-activities">Activities</div>
              <div className="header-emissions">Total Emissions</div>
            </div>

            <div className="table-body">
              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`table-row ${entry.rank <= 3 ? 'top-rank' : ''}`}
                >
                  <div className="row-rank">
                    <span className="rank-badge">{getRankEmoji(entry.rank)}</span>
                  </div>
                  <div className="row-user">
                    <div className="user-avatar">
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="user-name">{entry.username}</span>
                  </div>
                  <div className="row-activities">{entry.activitiesCount}</div>
                  <div className="row-emissions">
                    <span className="emission-value">{entry.totalEmissions}</span>
                    <span className="emission-unit">kg CO2e</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="info-box">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <h4>How Rankings Work</h4>
            <p>
              Users with the <strong>lowest</strong> carbon emissions rank higher.
              Keep logging your sustainable choices to climb up the leaderboard!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
