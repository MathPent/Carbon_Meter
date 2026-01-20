import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import AutomaticTrips from '../components/dashboard/AutomaticTrips';
import axios from 'axios';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalEmissions: 0,
    activitiesCount: 0,
    automaticTripsCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch all activities
      const activitiesResponse = await axios.get('/api/activities', config);
      const activities = activitiesResponse.data;

      // Calculate stats
      const totalEmissions = activities.reduce((sum, activity) => sum + activity.carbonEmission, 0);
      const automaticTrips = activities.filter(a => a.logType === 'automatic');

      setStats({
        totalEmissions: totalEmissions.toFixed(2),
        activitiesCount: activities.length,
        automaticTripsCount: automaticTrips.length
      });
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
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{loading ? '...' : stats.activitiesCount}</h3>
            <p>Activities Logged</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚗</div>
          <div className="stat-info">
            <h3>{loading ? '...' : stats.automaticTripsCount}</h3>
            <p>Automatic Trips</p>
          </div>
        </div>
      </div>

      {/* Automatic Trips Widget */}
      <div className="dashboard-widgets">
        <AutomaticTrips />
      </div>
    </div>
  );
};

export default DashboardPage;
