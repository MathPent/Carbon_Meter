import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
    checkBadges();
  }, []);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/activities/user-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBadges = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/badges/check-eligibility', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  // Calculate trees equivalent (1 tree absorbs ~20 kg CO2/year)
  const calculateTrees = (totalEmissions) => {
    if (!totalEmissions) return 0;
    return Math.ceil(totalEmissions / 20);
  };

  return (
    <div className="individual-dashboard">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <div className="welcome-content">
          <h1 className="welcome-title">Welcome back, {user?.name || 'User'}!</h1>
          <p className="welcome-subtitle">Track your carbon footprint and make a difference today</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-container">
        <div className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <button 
              className="action-card"
              onClick={() => navigate('/log-activity')}
            >
              <div className="action-icon">📊</div>
              <h3>Log Activity</h3>
              <p>Record your daily carbon emissions</p>
            </button>

            <button 
              className="action-card"
              onClick={() => navigate('/calculator')}
            >
              <div className="action-icon">🧮</div>
              <h3>Carbon Calculator</h3>
              <p>Calculate your carbon footprint</p>
            </button>

            <button 
              className="action-card"
              onClick={() => navigate('/history')}
            >
              <div className="action-icon">📈</div>
              <h3>View History</h3>
              <p>Track your emission trends</p>
            </button>

            <button 
              className="action-card"
              onClick={() => navigate('/badges')}
            >
              <div className="action-icon">🏆</div>
              <h3>My Badges</h3>
              <p>View your achievements</p>
            </button>
          </div>
        </div>

        {/* Personal Stats */}
        <div className="personal-stats-section">
          <h2 className="section-title">Your Carbon Journey</h2>
          {loading ? (
            <div className="stats-loading">Loading your stats...</div>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">🌱</div>
                  <div className="stat-content">
                    <p className="stat-label">Activities Logged</p>
                    <h3 className="stat-value">{stats?.totalActivities || 0}</h3>
                    <p className="stat-hint">
                      {stats?.totalActivities > 0 
                        ? 'Keep it up!' 
                        : 'Start logging to see your data'}
                    </p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <p className="stat-label">Today's Emissions</p>
                    <h3 className="stat-value">{stats?.dailyEmissions || 0} kg</h3>
                    <p className="stat-hint">CO2e emitted today</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⚡</div>
                  <div className="stat-content">
                    <p className="stat-label">Monthly Emissions</p>
                    <h3 className="stat-value">{stats?.monthlyEmissions || 0} kg</h3>
                    <p className="stat-hint">This month's total</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🌳</div>
                  <div className="stat-content">
                    <p className="stat-label">Trees to Offset</p>
                    <h3 className="stat-value">{calculateTrees(stats?.totalEmissions)}</h3>
                    <p className="stat-hint">Trees needed to offset total</p>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              {stats && stats.totalActivities > 0 && (
                <div className="category-breakdown">
                  <h3 className="breakdown-title">Emissions by Category</h3>
                  <div className="breakdown-grid">
                    {Object.entries(stats.categoryBreakdown).map(([category, emission]) => (
                      <div key={category} className="breakdown-item">
                        <span className="breakdown-category">{category}</span>
                        <span className="breakdown-value">{emission.toFixed(2)} kg CO2e</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activities */}
              {stats && stats.recentActivities && stats.recentActivities.length > 0 && (
                <div className="recent-activities">
                  <h3 className="breakdown-title">Recent Activities</h3>
                  <div className="activity-list">
                    {stats.recentActivities.map((activity) => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-info">
                          <span className="activity-category">{activity.category}</span>
                          <span className="activity-description">{activity.description}</span>
                          <span className="activity-date">
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="activity-emission">
                          {activity.carbonEmission.toFixed(2)} kg CO2e
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Getting Started Guide */}
        <div className="getting-started-section">
          <h2 className="section-title">Getting Started</h2>
          <div className="guide-cards">
            <div className="guide-card">
              <div className="guide-number">1</div>
              <div className="guide-content">
                <h4>Log Your First Activity</h4>
                <p>Click "Log Activity" to start tracking your carbon emissions across transportation, energy, food, and more.</p>
              </div>
            </div>

            <div className="guide-card">
              <div className="guide-number">2</div>
              <div className="guide-content">
                <h4>View Your Results</h4>
                <p>Get detailed analytics with charts showing your emission breakup and comparisons with averages.</p>
              </div>
            </div>

            <div className="guide-card">
              <div className="guide-number">3</div>
              <div className="guide-content">
                <h4>Track Your Progress</h4>
                <p>Monitor your trends over time and earn badges for sustainable habits.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
