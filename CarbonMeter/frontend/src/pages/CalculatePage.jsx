import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TransportModule from '../components/logActivity/modules/TransportModule';
import ElectricityModule from '../components/logActivity/modules/ElectricityModule';
import FoodModule from '../components/logActivity/modules/FoodModule';
import WasteModule from '../components/logActivity/modules/WasteModule';
import EmissionDisplay from '../components/logActivity/EmissionDisplay';
import QuickEstimator from '../components/logActivity/QuickEstimator';
import MapBasedTransport from '../components/calculator/MapBasedTransport';
import LiveTripTracker from '../components/calculator/LiveTripTracker';
import './CalculatePage.css';

const CalculatePage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('method'); // method, category, module, result, quickEstimator, mapTransport, liveTracking
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [calculatedData, setCalculatedData] = useState(null);

  const categories = [
    { id: 'transport', name: 'Transport', icon: '🚗', description: 'Road, Air, Rail emissions' },
    { id: 'electricity', name: 'Electricity', icon: '⚡', description: 'Grid, DG, Renewable' },
    { id: 'food', name: 'Food', icon: '🍽️', description: 'Animal & Plant-based' },
    { id: 'waste', name: 'Waste', icon: '🗑️', description: 'Food, Solid, Liquid waste' }
  ];

  const handleMethodSelect = (method) => {
    if (method === 'manual') {
      setCurrentStep('category');
    } else if (method === 'quick') {
      setCurrentStep('quickEstimator');
    } else if (method === 'map') {
      setCurrentStep('mapTransport');
    } else if (method === 'live') {
      setCurrentStep('liveTracking');
    }
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentStep('module');
  };

  const handleCalculate = (data, emission) => {
    setCalculatedData({ ...data, emission });
    setCurrentStep('result');
  };

  const handleBack = () => {
    if (currentStep === 'result') {
      setCurrentStep('module');
      setCalculatedData(null);
    } else if (currentStep === 'module') {
      setCurrentStep('category');
      setSelectedCategory(null);
    } else if (currentStep === 'category' || currentStep === 'quickEstimator' || currentStep === 'mapTransport' || currentStep === 'liveTracking') {
      setCurrentStep('method');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSaveComplete = () => {
    navigate('/dashboard', { replace: true, state: { refresh: true } });
  };

  const handleMapTransportComplete = (emissionData) => {
    // Navigate to dashboard after successful save
    navigate('/dashboard', { replace: true, state: { refresh: true } });
  };

  const handleLiveTrackingComplete = (tripData) => {
    // Navigate to dashboard after successful save
    navigate('/dashboard', { replace: true, state: { refresh: true } });
  };

  const renderModule = () => {
    switch (selectedCategory) {
      case 'transport':
        return <TransportModule onCalculate={handleCalculate} onBack={handleBack} />;
      case 'electricity':
        return <ElectricityModule onCalculate={handleCalculate} onBack={handleBack} />;
      case 'food':
        return <FoodModule onCalculate={handleCalculate} onBack={handleBack} />;
      case 'waste':
        return <WasteModule onCalculate={handleCalculate} onBack={handleBack} />;
      default:
        return null;
    }
  };

  return (
    <div className="calculate-page">
      {/* Header */}
      <div className="calculate-header">
        <button className="back-btn" onClick={handleBack}>
          ← Back
        </button>
        <h1>Calculate Carbon Emissions</h1>
        <div className="step-indicator">
          {currentStep === 'method' && 'Choose Method'}
          {currentStep === 'quickEstimator' && 'Quick Estimator'}
          {currentStep === 'mapTransport' && 'Step: Map-Based Transport'}
          {currentStep === 'liveTracking' && 'Live Transport Tracking'}
          {currentStep === 'category' && 'Select Category'}
          {currentStep === 'module' && `${selectedCategory?.toUpperCase()} Module`}
          {currentStep === 'result' && 'Results'}
        </div>
      </div>

      {/* Main Content */}
      <div className="calculate-content">
        {currentStep === 'method' && (
          <div className="method-selection">
            <h2 className="section-title">Select how you want to log</h2>
            
            <div className="method-grid">
              <button className="method-card" onClick={() => handleMethodSelect('manual')}>
                <div className="method-badge">RECOMMENDED</div>
                <div className="method-icon">📝</div>
                <h3>Manual Logging</h3>
                <p>Enter detailed activity data for accurate emission calculation</p>
                
                <ul className="method-features">
                  <li>✓ Precise calculations</li>
                  <li>✓ Category-wise tracking</li>
                  <li>✓ Saved to dashboard</li>
                  <li>✓ Government-approved formulas</li>
                </ul>
              </button>

              <button className="method-card quick-card" onClick={() => handleMethodSelect('quick')}>
                <div className="method-badge quick-badge">QUICK MODE</div>
                <div className="method-icon">⚡</div>
                <h3>Quick Footprint Estimator</h3>
                <p>Get a fast estimate by describing your activity</p>
                
                <ul className="method-features">
                  <li>✓ Fast estimation</li>
                  <li>✓ Text-based input</li>
                  <li>✓ Approximate results</li>
                  <li>✓ No save unless confirmed</li>
                </ul>
              </button>

              <button className="method-card map-card" onClick={() => handleMethodSelect('map')}>
                <div className="method-badge map-badge">MAP MODE</div>
                <div className="method-icon">🗺️</div>
                <h3>Map-Based Transport</h3>
                <p>Track transport emissions using map and destination selection</p>
                
                <ul className="method-features">
                  <li>✓ Real distance calculation</li>
                  <li>✓ Interactive map</li>
                  <li>✓ Real vehicle data</li>
                  <li>✓ Static route planning</li>
                </ul>
              </button>

              <button className="method-card live-card" onClick={() => handleMethodSelect('live')}>
                <div className="method-badge live-badge">FEATURED</div>
                <div className="method-icon">🌍</div>
                <h3>Live Transport Tracking</h3>
                <p>Track emissions in real-time using GPS while you travel</p>
                
                <ul className="method-features">
                  <li>✓ Real-time GPS tracking</li>
                  <li>✓ Live distance measurement</li>
                  <li>✓ Accurate CO₂ calculation</li>
                  <li>✓ Works while app is open</li>
                </ul>
              </button>
            </div>
          </div>
        )}

        {currentStep === 'quickEstimator' && (
          <QuickEstimator onBack={handleBack} />
        )}

        {currentStep === 'mapTransport' && (
          <MapBasedTransport 
            onBack={handleBack}
            onComplete={handleMapTransportComplete}
          />
        )}

        {currentStep === 'liveTracking' && (
          <LiveTripTracker
            onBack={handleBack}
            onComplete={handleLiveTrackingComplete}
          />
        )}

        {currentStep === 'category' && (
          <div className="category-selection">
            <h2 className="section-title">Choose Emission Category</h2>
            <p className="section-subtitle">Select a category to calculate your carbon footprint using government-approved formulas</p>
            
            <div className="category-grid">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className="category-card"
                  onClick={() => handleCategorySelect(cat.id)}
                >
                  <div className="category-icon">{cat.icon}</div>
                  <h3>{cat.name}</h3>
                  <p>{cat.description}</p>
                </button>
              ))}
            </div>

            <div className="info-note">
              <span className="info-icon">ℹ️</span>
              <p>All calculations use official emission factors from IPCC, MoEFCC India, CEA, and CPCB</p>
            </div>
          </div>
        )}

        {currentStep === 'module' && renderModule()}

        {currentStep === 'result' && calculatedData && (
          <EmissionDisplay 
            category={calculatedData.category || selectedCategory}
            emission={calculatedData.emission}
            data={calculatedData}
            onReset={() => setCurrentStep('method')}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
};

export default CalculatePage;
