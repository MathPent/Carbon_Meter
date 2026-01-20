import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogOptionSelector from '../components/logActivity/LogOptionSelector';
import CategorySelection from '../components/logActivity/CategorySelection';
import TransportModule from '../components/logActivity/modules/TransportModule';
import ElectricityModule from '../components/logActivity/modules/ElectricityModule';
import FoodModule from '../components/logActivity/modules/FoodModule';
import WasteModule from '../components/logActivity/modules/WasteModule';
import QuickEstimator from '../components/logActivity/QuickEstimator';
import EmissionDisplay from '../components/logActivity/EmissionDisplay';
import AutomaticTransport from '../components/logActivity/AutomaticTransport';
import './LogActivityPage.css';

const LogActivityPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('option'); // option, category, module, display, automatic
  const [logType, setLogType] = useState(null); // manual, quick, automatic
  const [selectedCategory, setSelectedCategory] = useState(null); // transport, electricity, food, waste
  const [emissionResult, setEmissionResult] = useState(null);
  const [activityData, setActivityData] = useState(null);

  const handleLogTypeSelect = (type) => {
    setLogType(type);
    if (type === 'manual') {
      setCurrentStep('category');
    } else if (type === 'quick') {
      setCurrentStep('quick');
    } else if (type === 'automatic') {
      setCurrentStep('automatic');
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentStep('module');
  };

  const handleCalculate = (data, emission) => {
    setActivityData(data);
    setEmissionResult(emission);
    setCurrentStep('display');
  };

  const handleBack = () => {
    if (currentStep === 'display') {
      setCurrentStep('module');
      setEmissionResult(null);
    } else if (currentStep === 'module') {
      setCurrentStep('category');
      setSelectedCategory(null);
    } else if (currentStep === 'category' || currentStep === 'quick' || currentStep === 'automatic') {
      setCurrentStep('option');
      setLogType(null);
    } else {
      navigate('/dashboard');
    }
  };

  const handleReset = () => {
    setCurrentStep('option');
    setLogType(null);
    setSelectedCategory(null);
    setEmissionResult(null);
    setActivityData(null);
  };

  const handleAutomaticComplete = () => {
    navigate('/dashboard');
  };

  return (
    <div className="log-activity-page">
      {/* Header */}
      <div className="log-activity-header">
        <button className="back-btn" onClick={handleBack}>
          ← Back
        </button>
        <h1>Log Activity</h1>
        <div className="step-indicator">
          Step: {currentStep === 'option' && '1/4'}
          {currentStep === 'category' && '2/4'}
          {currentStep === 'module' && '3/4'}
          {currentStep === 'display' && '4/4'}
          {currentStep === 'quick' && 'Quick Estimator'}
          {currentStep === 'automatic' && 'Automatic Transport'}
        </div>
      </div>

      {/* Main Content */}
      <div className="log-activity-content">
        {currentStep === 'option' && (
          <LogOptionSelector onSelect={handleLogTypeSelect} />
        )}

        {currentStep === 'category' && (
          <CategorySelection onSelect={handleCategorySelect} />
        )}

        {currentStep === 'module' && selectedCategory === 'transport' && (
          <TransportModule onCalculate={handleCalculate} onBack={handleBack} />
        )}

        {currentStep === 'module' && selectedCategory === 'electricity' && (
          <ElectricityModule onCalculate={handleCalculate} onBack={handleBack} />
        )}

        {currentStep === 'module' && selectedCategory === 'food' && (
          <FoodModule onCalculate={handleCalculate} onBack={handleBack} />
        )}

        {currentStep === 'module' && selectedCategory === 'waste' && (
          <WasteModule onCalculate={handleCalculate} onBack={handleBack} />
        )}

        {currentStep === 'quick' && (
          <QuickEstimator onBack={handleBack} />
        )}

        {currentStep === 'automatic' && (
          <AutomaticTransport 
            onComplete={handleAutomaticComplete}
            onCancel={handleBack}
          />
        )}

        {currentStep === 'display' && (
          <EmissionDisplay
            category={selectedCategory}
            data={activityData}
            emission={emissionResult}
            onReset={handleReset}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
};

export default LogActivityPage;
