import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="individual-dashboard">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <div className="welcome-content">
          <h1 className="welcome-title">Welcome back, {user?.name || 'User'}!</h1>
          <p className="welcome-subtitle">Track your carbon footprint and make a difference today</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
