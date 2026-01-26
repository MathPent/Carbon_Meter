import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import GlobalEmissionsChart from '../components/home/GlobalEmissionsChart';
import IndiaStats from '../components/home/IndiaStats';
import CO2Concentration from '../components/home/CO2Concentration';
import WhyItMatters from '../components/home/WhyItMatters';
import QuoteCarousel from '../components/home/QuoteCarousel';
import VisualStorytelling from '../components/home/VisualStorytelling';
import InteractiveGraph from '../components/home/InteractiveGraph';
import CTASection from '../components/home/CTASection';
import DataSources from '../components/home/DataSources';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const handleDiscoverClick = () => {
    navigate('/discover');
  };

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
                onClick={handleDiscoverClick}
              >
                Discover Your Footprint
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

      {/* Premium Educational Sections */}
      <GlobalEmissionsChart />
      <IndiaStats />
      <CO2Concentration />
      <WhyItMatters />
      <QuoteCarousel />
      <VisualStorytelling />
      <InteractiveGraph />
      
      {/* CTA Section - only show if not authenticated */}
      {!isAuthenticated && <CTASection />}
      
      {/* Data Sources Footer */}
      <DataSources />

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 CarbonMeter. Helping you track and reduce your carbon footprint.</p>
      </footer>
    </div>
  );
};

export default HomePage;
