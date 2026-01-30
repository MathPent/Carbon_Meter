import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api.config';
import GovNavbar from '../../components/gov/GovNavbar';
import './GovLeaderboard.css';

const GovLeaderboard = () => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [filter, setFilter] = useState('lowest'); // lowest or highest
  const [timeFrame, setTimeFrame] = useState('month'); // week, month, year

  useEffect(() => {
    fetchLeaderboard();
  }, [filter, timeFrame]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_ENDPOINTS.GOV.BASE}/leaderboard?filter=${filter}&timeFrame=${timeFrame}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <>
        <GovNavbar />
        <div className="gov-loading">
          <div className="gov-spinner"></div>
          <p>Loading Leaderboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <GovNavbar />
      <div className="gov-leaderboard">
        {/* Header */}
        <div className="leaderboard-header">
          <div>
            <h1>Department Leaderboard</h1>
            <p>Compare and track emission performance across departments</p>
          </div>
        </div>

        {/* Filters */}
        <div className="leaderboard-filters">
          <div className="filter-group">
            <label>Sort By:</label>
            <div className="filter-buttons">
              <button
                className={filter === 'lowest' ? 'active' : ''}
                onClick={() => setFilter('lowest')}
              >
                🏆 Lowest Emissions
              </button>
              <button
                className={filter === 'highest' ? 'active' : ''}
                onClick={() => setFilter('highest')}
              >
                ⚠️ Highest Emissions
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Time Period:</label>
            <div className="filter-buttons">
              <button
                className={timeFrame === 'week' ? 'active' : ''}
                onClick={() => setTimeFrame('week')}
              >
                Week
              </button>
              <button
                className={timeFrame === 'month' ? 'active' : ''}
                onClick={() => setTimeFrame('month')}
              >
                Month
              </button>
              <button
                className={timeFrame === 'year' ? 'active' : ''}
                onClick={() => setTimeFrame('year')}
              >
                Year
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="leaderboard-container">
          {leaderboard.length > 0 ? (
            <div className="leaderboard-list">
              {leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className={`leaderboard-item ${index < 3 ? 'podium' : ''}`}
                >
                  <div className="rank">
                    <span className="rank-badge">{getMedalIcon(index + 1)}</span>
                  </div>
                  <div className="department-info">
                    <h3>{entry.departmentName}</h3>
                    <p>{entry.organizationType}</p>
                  </div>
                  <div className="emission-stats">
                    <div className="stat">
                      <span className="stat-label">Total Emission</span>
                      <span className="stat-value">
                        {entry.totalEmission.toFixed(2)} kg CO₂e
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Activities</span>
                      <span className="stat-value">{entry.activityCount}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Avg per Activity</span>
                      <span className="stat-value">
                        {entry.avgPerActivity.toFixed(2)} kg CO₂e
                      </span>
                    </div>
                  </div>
                  {entry.trend && (
                    <div className="trend">
                      {entry.trend === 'up' ? '📈' : '📉'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-leaderboard">
              <span>📊</span>
              <h3>No Department Data Available</h3>
              <p>Leaderboard will populate as departments log activities</p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="info-box">
          <h3>💡 About the Leaderboard</h3>
          <p>
            The Government Leaderboard compares emission performance across different
            departments and organization types. Departments with{' '}
            <strong>lowest emissions</strong> demonstrate better sustainability practices
            and are ranked higher. Use this to identify best practices and areas for
            improvement.
          </p>
        </div>
      </div>
    </>
  );
};

export default GovLeaderboard;
