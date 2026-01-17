import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import './AuthPage.css';

const AuthPage = () => {
  const [showLogin, setShowLogin] = useState(true);
  const navigate = useNavigate();

  const switchToRegister = () => {
    setShowLogin(false);
  };

  const switchToLogin = () => {
    setShowLogin(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${showLogin ? 'active' : ''}`}
            onClick={switchToLogin}
          >
            Login
          </button>
          <button
            className={`auth-tab ${!showLogin ? 'active' : ''}`}
            onClick={switchToRegister}
          >
            Register
          </button>
        </div>

        {/* Content */}
        <div className="auth-content">
          {showLogin ? (
            <div className="auth-form-wrapper">
              <LoginPage onSwitchToRegister={switchToRegister} />
            </div>
          ) : (
            <div className="auth-form-wrapper">
              <RegisterPage onSwitchToLogin={switchToLogin} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
