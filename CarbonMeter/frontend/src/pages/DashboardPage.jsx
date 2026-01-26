import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import AutomaticTrips from '../components/dashboard/AutomaticTrips';
import ActivityLog from '../components/dashboard/ActivityLog';
import BadgesSection from '../components/dashboard/BadgesSection';
import axios from 'axios';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview'); // overview, log-activity
  const [stats, setStats] = useState({
    totalEmissions: 0,
    dailyEmissions: 0,
    monthlyEmissions: 0,
    activitiesCount: 0,
    categoryBreakdown: {},
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchDashboardStats();
  }, [refreshTrigger]);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch user statistics from correct endpoint
      const statsResponse = await axios.get('/api/activities/user-stats', config);
      const data = statsResponse.data;

      if (data.success) {
        setStats({
          totalEmissions: data.stats.totalEmissions || 0,
          dailyEmissions: data.stats.dailyEmissions || 0,
          monthlyEmissions: data.stats.monthlyEmissions || 0,
          activitiesCount: data.stats.totalActivities || 0,
          categoryBreakdown: data.stats.categoryBreakdown || {},
          recentActivities: data.stats.recentActivities || []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="individual-dashboard">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <div className="welcome-content">
          <h1>Welcome back, {user?.username || 'User'}!</h1>
          <p>Track your carbon footprint and environmental impact</p>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'log-activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('log-activity')}
        >
          📋 Log Activity
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="dashboard-overview">
          {/* Stats Cards */}
          <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">🌍</div>
          <div className="stat-info">
            <h3>{loading ? '...' : stats.totalEmissions}</h3>
            <p>Total CO₂ Emissions (kg)</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">�</div>
          <div className="stat-info">
            <h3>{loading ? '...' : stats.monthlyEmissions}</h3>
            <p>This Month (kg CO₂)</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{loading ? '...' : stats.activitiesCount}</h3>
            <p>Activities Logged</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {!loading && stats.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 && (
        <div className="category-breakdown">
          <h2>Emissions by Category</h2>
          <div className="breakdown-grid">
            {Object.entries(stats.categoryBreakdown).map(([category, value]) => {
              const icons = {
                Transport: '🚗',
                Electricity: '⚡',
                Food: '🍽️',
                Waste: '♻️'
              };
              return value > 0 && (
                <div key={category} className="breakdown-item">
                  <span className="breakdown-icon">{icons[category] || '📊'}</span>
                  <div className="breakdown-details">
                    <h4>{category}</h4>
                    <p>{value.toFixed(2)} kg CO₂</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {!loading && stats.recentActivities && stats.recentActivities.length > 0 && (
        <div className="recent-activities">
          <h2>Recent Activities</h2>
          <div className="activities-list">
            {stats.recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.category === 'Transport' && '🚗'}
                  {activity.category === 'Electricity' && '⚡'}
                  {activity.category === 'Food' && '🍽️'}
                  {activity.category === 'Waste' && '♻️'}
                </div>
                <div className="activity-details">
                  <h4>{activity.description}</h4>
                  <p>{activity.category} • {activity.carbonEmission.toFixed(2)} kg CO₂</p>
                  <span className="activity-date">{new Date(activity.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automatic Trips Widget */}
      <div className="dashboard-widgets">
        <AutomaticTrips />
      </div>

      {/* Carbon Status & Badges */}
      <BadgesSection emissionData={stats} />
        </div>
      )}

      {activeTab === 'log-activity' && (
        <ActivityLog />
      )}
    </div>
  );
};

export default DashboardPage;
