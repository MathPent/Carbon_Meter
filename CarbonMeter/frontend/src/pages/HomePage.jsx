import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            "Every ton of carbon saved is a step toward a sustainable future."
          </h1>
          <p className="hero-subtitle">
            Join thousands of climate-conscious individuals making a difference
          </p>

          {!isAuthenticated && (
            <div className="hero-buttons">
              <button
                className="hero-cta-button"
                onClick={() => navigate('/discover')}
              >
                Discover Your Footprint
              </button>
              <button
                className="hero-secondary-button"
                onClick={() => navigate('/auth')}
              >
                Get Started Now
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number">12.5</div>
            <div className="stat-label">Total Carbon Footprint (tons)</div>
            <div className="stat-year">This year</div>
          </div>

          <div className="stat-card">
            <div className="stat-number stat-highlight">3.2</div>
            <div className="stat-label">Carbon Saved (tons)</div>
            <div className="stat-year">This year</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">0.8</div>
            <div className="stat-label">Monthly Emission Goal</div>
            <div className="stat-year">65% used</div>
          </div>

          <div className="stat-card">
            <div className="stat-number stat-light">245</div>
            <div className="stat-label">Community Saved</div>
            <div className="stat-year">Global community</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>How CarbonMeter Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Track Your Footprint</h3>
            <p>
              Monitor your daily activities and see how they impact your carbon footprint
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Set Goals</h3>
            <p>
              Create personalized targets to reduce your carbon emissions and stay motivated
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Earn Badges</h3>
            <p>
              Unlock achievements as you reach milestones on your sustainability journey
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Join Community</h3>
            <p>
              Connect with others, share tips, and make a collective impact on the environment
            </p>
          </div>
        </div>
      </section>

      {/* Badges Section */}
      {isAuthenticated && (
        <section className="badges-section">
          <h2>Your Badges</h2>
          <div className="badges-container">
            <div className="badge">
              <div className="badge-icon">♻️</div>
              <div className="badge-name">Eco Hero</div>
            </div>
            <div className="badge">
              <div className="badge-icon">🌱</div>
              <div className="badge-name">Green Warrior</div>
            </div>
            <div className="badge">
              <div className="badge-icon">💚</div>
              <div className="badge-name">Climate Champion</div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta-section">
          <h2>Ready to Make a Difference?</h2>
          <p>Join thousands of users already tracking their carbon footprint</p>
          <button
            className="cta-button"
            onClick={() => navigate('/auth')}
          >
            Sign Up for Free
          </button>
        </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 CarbonMeter. Helping you track and reduce your carbon footprint.</p>
      </footer>
    </div>
  );
};

export default HomePage;
