import React from 'react';
import { useNavigate } from 'react-router-dom';
import QuestionWizard from '../components/calculator/QuestionWizard';
import './DiscoverPage.css';

const DiscoverPage = () => {
  const navigate = useNavigate();

  return (
    <div className="discover-page">
      <div className="discover-header">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
        <h1 className="discover-title">Discover Your Carbon Footprint</h1>
        <p className="discover-subtitle">
          Take a few minutes to understand your environmental impact
        </p>
      </div>

      <QuestionWizard />

      <div className="discover-footer">
        <p className="disclaimer">
          ⓘ This is a quick estimate. For accurate tracking and personalized insights,
          <button className="link-button" onClick={() => navigate('/register')}>
            create an account
          </button>
        </p>
      </div>
    </div>
  );
};

export default DiscoverPage;
