import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LeaderboardPage.css';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState('monthly'); // all, monthly, weekly
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/activities/leaderboard?period=${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setLeaderboard(response.data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
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
