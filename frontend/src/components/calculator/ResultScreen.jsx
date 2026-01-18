import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateTotalFootprint, getComparisonMessage } from '../../utils/carbonCalculations';

const ResultScreen = ({ data, onRestart }) => {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Calculate results
    const footprint = calculateTotalFootprint(data);
    setResults(footprint);

    // Trigger animation
    setTimeout(() => setShowAnimation(true), 100);
  }, [data]);

  if (!results) {
    return <div className="loading">Calculating your footprint...</div>;
  }

  const { total, breakdown } = results;
  const comparisonMessage = getComparisonMessage(total);
  const yearlyTotal = (total * 12 / 1000).toFixed(2); // Convert to tonnes per year

  // Calculate percentages for visualization
  const calculatePercentage = (value) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : 0;
  };

  const categories = [
    { name: 'Electricity', value: breakdown.electricity, color: '#FFD700', icon: '⚡' },
    { name: 'Housing', value: breakdown.housing, color: '#FF6B6B', icon: '🏠' },
    { name: 'Food', value: breakdown.food, color: '#4ECDC4', icon: '🍽️' },
    { name: 'Waste', value: breakdown.waste, color: '#95E1D3', icon: '♻️' },
    { name: 'Personal Transport', value: breakdown.personalTransport, color: '#F38181', icon: '🚗' },
    { name: 'Public Transport', value: breakdown.publicTransport, color: '#AA96DA', icon: '🚌' },
    { name: 'Air Travel', value: breakdown.airTravel, color: '#FCBAD3', icon: '✈️' },
    { name: 'Government', value: breakdown.government, color: '#A8D8EA', icon: '🏛️' }
  ].filter(cat => cat.value > 0); // Only show non-zero categories

  return (
    <div className={`result-screen ${showAnimation ? 'show' : ''}`}>
      <div className="result-header">
        <div className="result-icon">🌍</div>
        <h1 className="result-title">Your Carbon Footprint</h1>
      </div>

      <div className="result-summary">
        <div className="total-emission">
          <h2>{total.toFixed(1)}</h2>
          <p>kg CO₂ / month</p>
        </div>
        <div className="yearly-emission">
          <h3>{yearlyTotal}</h3>
          <p>tonnes CO₂ / year</p>
        </div>
      </div>

      <div className="comparison-message">
        <p>{comparisonMessage}</p>
      </div>

      <div className="result-breakdown">
        <h3>Breakdown by Category</h3>
        <div className="breakdown-chart">
          {categories.map((category, index) => (
            <div key={index} className="breakdown-item" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="breakdown-header">
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
                <span className="category-value">{category.value} kg</span>
              </div>
              <div className="breakdown-bar-container">
                <div 
                  className="breakdown-bar"
                  style={{ 
                    width: `${calculatePercentage(category.value)}%`,
                    backgroundColor: category.color
                  }}
                />
              </div>
              <div className="breakdown-percentage">
                {calculatePercentage(category.value)}% of total
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="result-insights">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          {breakdown.personalTransport > breakdown.publicTransport && breakdown.personalTransport > 50 && (
            <div className="insight-card">
              <span className="insight-icon">🚗</span>
              <p>Your personal transport emissions are high. Consider carpooling or public transport!</p>
            </div>
          )}
          {breakdown.food > 150 && (
            <div className="insight-card">
              <span className="insight-icon">🌱</span>
              <p>Reducing meat consumption could significantly lower your food-related emissions.</p>
            </div>
          )}
          {breakdown.electricity > 200 && (
            <div className="insight-card">
              <span className="insight-icon">💡</span>
              <p>High electricity use detected. Energy-efficient appliances can help!</p>
            </div>
          )}
          {breakdown.airTravel > 100 && (
            <div className="insight-card">
              <span className="insight-icon">✈️</span>
              <p>Air travel is a major contributor. Consider alternatives for shorter trips.</p>
            </div>
          )}
          {total < 300 && (
            <div className="insight-card success">
              <span className="insight-icon">🌟</span>
              <p>Great job! Your footprint is relatively low. Keep up the good work!</p>
            </div>
          )}
        </div>
      </div>

      <div className="result-actions">
        <h3>What's Next?</h3>
        <p className="action-description">
          This is just an estimate. Create an account to track your carbon footprint accurately, 
          set goals, and see your progress over time!
        </p>
        <div className="action-buttons">
          <button className="btn-primary-large" onClick={() => navigate('/register')}>
            Create Account & Track Progress
          </button>
          <button className="btn-secondary-large" onClick={onRestart}>
            Recalculate
          </button>
        </div>
      </div>

      <div className="result-disclaimer">
        <p>
          <strong>Disclaimer:</strong> This calculator provides estimates based on general assumptions. 
          Actual emissions may vary based on specific circumstances, regional factors, and lifestyle details. 
          For accurate tracking, please create an account and use our detailed logging features.
        </p>
      </div>
    </div>
  );
};

export default ResultScreen;
