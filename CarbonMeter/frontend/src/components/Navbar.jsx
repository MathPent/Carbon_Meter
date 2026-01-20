import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const handleLoginRegister = () => {
    navigate('/auth');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          🌍 CarbonMeter
        </Link>

        {/* Navigation Links */}
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">
            Dashboard
          </Link>
          <Link to="/log-activity" className="navbar-link">
            Log Activity
          </Link>
          <Link to="/leaderboard" className="navbar-link">
            Leaderboard
          </Link>
          <a href="#carbon-map" className="navbar-link">
            Carbon Map
          </a>
          <a href="#tips" className="navbar-link">
            Tips
          </a>

          {/* Auth Section */}
          <div className="navbar-auth">
            {isAuthenticated ? (
              <div className="user-menu-container">
                <button
                  className="user-menu-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  👋 Hello {user?.firstName || user?.email}
                  <span className="dropdown-arrow">⌄</span>
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      {user?.firstName} {user?.lastName || ''}
                    </div>
                    <div className="dropdown-email">
                      {user?.email}
                    </div>
                    <div className="dropdown-divider"></div>
                    
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/dashboard');
                        setShowUserMenu(false);
                      }}
                    >
                      📊 Dashboard
                    </button>
                    
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}
                    >
                      👤 Profile
                    </button>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="auth-button"
                onClick={handleLoginRegister}
              >
                Login / Register
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
