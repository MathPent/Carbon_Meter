import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './OrgNavbar.css';

const OrgNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const navItems = [
    { path: '/org/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/org/calculate', label: 'Calculate Emissions', icon: '🧮' },
    { path: '/org/log-activity', label: 'Log Activity', icon: '📋' },
    { path: '/org/analytics', label: 'Analytics', icon: '📈' },
    { path: '/org/carbon-credits', label: 'Carbon Credits', icon: '🪙' },
    { path: '/org/reports', label: 'Reports', icon: '📑' },
    { path: '/org/compare', label: 'Compare', icon: '⚖️' },
  ];

  return (
    <nav className="org-navbar">
      <div className="org-navbar-container">
        {/* Logo */}
        <Link to="/org/dashboard" className="org-navbar-logo">
          <span className="logo-icon">🏭</span>
          <span className="logo-text">CarbonMeter</span>
          <span className="logo-badge">Organization</span>
        </Link>

        {/* Navigation Links */}
        <div className="org-navbar-menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`org-navbar-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="link-icon">{item.icon}</span>
              <span className="link-text">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="org-navbar-user">
          <button
            className="user-menu-button"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span className="user-icon">🏢</span>
            <span className="user-name">{user.organizationName || user.firstName}</span>
            <span className="dropdown-arrow">▼</span>
          </button>

          {showDropdown && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <strong>{user.organizationName}</strong>
                <span className="user-type">{user.industryType}</span>
              </div>
              <div className="dropdown-divider"></div>
              <Link
                to="/org/settings"
                className="dropdown-item"
                onClick={() => setShowDropdown(false)}
              >
                ⚙️ Settings
              </Link>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default OrgNavbar;
