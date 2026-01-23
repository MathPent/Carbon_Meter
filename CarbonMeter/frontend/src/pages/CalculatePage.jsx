import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LogOptionSelector from '../components/logActivity/LogOptionSelector';
import ManualLoggingQuestionnaire from '../components/logActivity/ManualLoggingQuestionnaire';
import AutomaticTransport from '../components/logActivity/AutomaticTransport';
import './CalculatePage.css';

const CalculatePage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('option'); // option, manual, automatic

  // Hide navbar when in manual logging flow
  useEffect(() => {
    if (currentStep === 'manual') {
      // Hide navbar by adding a class to body
      document.body.classList.add('hide-navbar');
    } else {
      document.body.classList.remove('hide-navbar');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('hide-navbar');
    };
  }, [currentStep]);

  const handleLogTypeSelect = (type) => {
    if (type === 'manual') {
      setCurrentStep('manual');
    } else if (type === 'automatic') {
      setCurrentStep('automatic');
    }
  };

  const handleManualComplete = () => {
    // Navigate to dashboard after activity logged
    navigate('/dashboard', { replace: true, state: { refresh: true } });
  };

  const handleManualCancel = () => {
    setCurrentStep('option');
  };

  const handleAutomaticComplete = () => {
    // Navigate to dashboard after activity logged
    navigate('/dashboard', { replace: true, state: { refresh: true } });
  };

  const handleBack = () => {
    if (currentStep === 'manual' || currentStep === 'automatic') {
      setCurrentStep('option');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="calculate-page">
      {/* Header - Only show when not in manual logging */}
      {currentStep === 'option' && (
        <div className="calculate-header">
          <button className="back-btn" onClick={handleBack}>
            ← Back
          </button>
          <h1>Calculate</h1>
          <div className="step-indicator">
            Choose Method
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="calculate-content">
        {currentStep === 'option' && (
          <LogOptionSelector onSelect={handleLogTypeSelect} />
        )}

        {currentStep === 'manual' && (
          <ManualLoggingQuestionnaire 
            onComplete={handleManualComplete}
            onCancel={handleManualCancel}
          />
        )}

        {currentStep === 'automatic' && (
          <AutomaticTransport 
            onComplete={handleAutomaticComplete}
            onCancel={handleBack}
          />
        )}
      </div>
    </div>
  );
};

export default CalculatePage;
