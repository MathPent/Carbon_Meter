import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './GovNavbar.css';
import logo from '../../assets/logos/logo.jpeg';

const GovNavbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const navItems = [
    { path: '/gov/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/gov/log-activity', label: 'Log Activity', icon: '📝' },
    { path: '/gov/analytics', label: 'Analytics', icon: '📈' },
    { path: '/gov/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { path: '/gov/carbon-map', label: 'Carbon Map', icon: '🗺️' },
    { path: '/gov/reports', label: 'Reports', icon: '📄' },
  ];

  return (
    <nav className="gov-navbar">
      <div className="gov-navbar-container">
        {/* Left Section - Logo & Brand */}
        <div className="gov-navbar-brand">
          <div className="gov-logo">
            <div className="logo-wrapper">
              <div className="energy-ring"></div>
              <img src={logo} alt="CarbonMeter Logo" className="navbar-logo-img" />
            </div>
            <div className="gov-brand-text">
              <h1>CarbonMeter</h1>
              <p>Government Portal</p>
            </div>
          </div>
        </div>

        {/* Center Section - Navigation Links */}
        <div className={`gov-navbar-links ${showMobileMenu ? 'mobile-open' : ''}`}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`gov-nav-link ${isActive(item.path)}`}
              onClick={() => setShowMobileMenu(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Right Section - User Profile */}
        <div className="gov-navbar-user">
          <div 
            className="gov-user-profile"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="gov-user-avatar">
              {user?.firstName?.[0]?.toUpperCase() || 'G'}
            </div>
            <div className="gov-user-info">
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span className="user-role">Government Official</span>
            </div>
            <svg 
              className="dropdown-icon" 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="currentColor"
            >
              <path d="M4.427 6.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 6H4.604a.25.25 0 00-.177.427z"/>
            </svg>
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="gov-profile-dropdown">
              <div className="profile-header">
                <div className="profile-avatar-large">
                  {user?.firstName?.[0]?.toUpperCase() || 'G'}
                </div>
                <div>
                  <div className="profile-name">{user?.firstName} {user?.lastName}</div>
                  <div className="profile-email">{user?.email}</div>
                  <div className="profile-badge">
                    <span className="badge-icon">🏛️</span>
                    Government Account
                  </div>
                </div>
              </div>
              
              <div className="profile-divider"></div>
              
              <button className="profile-menu-item">
                <span className="menu-icon">⚙️</span>
                Settings
              </button>
              
              <button className="profile-menu-item">
                <span className="menu-icon">👤</span>
                Profile
              </button>
              
              <div className="profile-divider"></div>
              
              <button 
                className="profile-menu-item logout"
                onClick={handleLogout}
              >
                <span className="menu-icon">🚪</span>
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="gov-mobile-toggle"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Overlay */}
      {showMobileMenu && (
        <div 
          className="mobile-overlay"
          onClick={() => setShowMobileMenu(false)}
        ></div>
      )}
    </nav>
  );
};

export default GovNavbar;
