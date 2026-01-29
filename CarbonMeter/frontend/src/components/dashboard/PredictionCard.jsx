import React, { useState, useEffect } from 'react';
import { predictionAPI } from '../../api';
import './PredictionCard.css';

const PredictionCard = () => {
  const [missingDays, setMissingDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');
  const [showAllDates, setShowAllDates] = useState(false);

  useEffect(() => {
    fetchMissingDays();
  }, []);

  const fetchMissingDays = async () => {
    try {
      setLoading(true);
      const response = await predictionAPI.getMissingDays();
      
      if (response.data.success) {
        setMissingDays(response.data.missingDays || []);
      }
    } catch (err) {
      console.error('Error fetching missing days:', err);
      setError('Failed to load missing days');
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async (date) => {
    try {
      setPredicting(true);
      setError('');
      setSelectedDate(date);
      
      const response = await predictionAPI.predictMissingDay(date);
      
      if (response.data.success) {
        setPrediction({
          date: response.data.date || date,
          emission: response.data.predicted_co2,
          confidence: response.data.confidence,
          daysUsed: response.data.daysUsed,
          message: response.data.message,
          demo: response.data.demo || false,
          breakdown: response.data.breakdown || null
        });
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err.response?.data?.message || 'Prediction failed. Please try again.');
      setPrediction(null);
    } finally {
      setPredicting(false);
    }
  };

  const handleSave = async () => {
    if (!prediction) return;
    
    try {
      setSaving(true);
      setError('');
      
      const response = await predictionAPI.confirmPrediction({
        date: prediction.date,
        carbonEmission: prediction.emission,
        confidence: prediction.confidence,
        source: 'Predicted (ML)',
        breakdown: prediction.breakdown
      });
      
      if (response.data.success) {
        alert('✅ Prediction confirmed and saved successfully!');
        
        // Remove saved date from missing days
        setMissingDays(prev => prev.filter(d => d !== prediction.date));
        
        // Clear prediction
        setPrediction(null);
        setSelectedDate(null);
        
        // Reload page to update dashboard and leaderboard
        window.location.reload();
      }
    } catch (err) {
      console.error('Save error:', err);
      
      if (err.response?.status === 409) {
        setError('This date already has a logged activity');
      } else {
        setError(err.response?.data?.message || 'Failed to save prediction');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPrediction(null);
    setSelectedDate(null);
    setError('');
  };

  const getConfidenceBadge = (confidence) => {
    // Handle both numeric (0-1) and string confidence values
    let confLevel = confidence;
    
    if (typeof confidence === 'number') {
      if (confidence >= 0.85) confLevel = 'high';
      else if (confidence >= 0.70) confLevel = 'medium';
      else confLevel = 'low';
    }
    
    const badges = {
      low: { icon: '⚠️', label: 'Low Confidence', class: 'confidence-low' },
      medium: { icon: '📊', label: 'Medium Confidence', class: 'confidence-medium' },
      high: { icon: '✅', label: 'High Confidence', class: 'confidence-high' }
    };
    return badges[confLevel] || badges.low;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="prediction-card">
        <div className="prediction-header">
          <h3>🔮 Missing Day Prediction</h3>
        </div>
        <div className="prediction-loading">
          <div className="spinner"></div>
          <p>Loading missing days...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prediction-card">
      <div className="prediction-header">
        <h3>🔮 Missing Day Prediction</h3>
        <p className="prediction-subtitle">AI-powered behavioral prediction based on your activity patterns</p>
      </div>

      {error && (
        <div className="prediction-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {missingDays.length === 0 ? (
        <div className="no-missing-days">
          <div className="success-icon">✅</div>
          <h4>Great Job!</h4>
          <p>You have no missing days. Keep up the consistent tracking!</p>
        </div>
      ) : (
        <>
          {!prediction ? (
            <div className="missing-days-list">
              <h4>Missing Dates ({missingDays.length})</h4>
              <p className="list-subtitle">Select a date to predict emission</p>
              
              <div className="dates-grid">
                {(showAllDates ? missingDays : missingDays.slice(0, 5)).map((date) => (
                  <div key={date} className="date-item">
                    <div className="date-info">
                      <span className="date-icon">📅</span>
                      <span className="date-text">{formatDate(date)}</span>
                    </div>
                    <button
                      className="btn-predict"
                      onClick={() => handlePredict(date)}
                      disabled={predicting}
                    >
                      {predicting && selectedDate === date ? (
                        <>
                          <span className="btn-spinner"></span>
                          Predicting...
                        </>
                      ) : (
                        'Predict'
                      )}
                    </button>
                  </div>
                ))}
              </div>
              
              {missingDays.length > 5 && (
                <button 
                  className="show-more-btn"
                  onClick={() => setShowAllDates(!showAllDates)}
                >
                  {showAllDates ? (
                    <>
                      <span>Show Less</span>
                      <span className="arrow-icon">▲</span>
                    </>
                  ) : (
                    <>
                      <span>Show All {missingDays.length} Dates</span>
                      <span className="arrow-icon">▼</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="prediction-result">
              <div className="result-header">
                <span className="result-icon">🤖</span>
                <h4>Prediction Preview</h4>
              </div>
              
              <div className="result-date">
                <strong>Date:</strong> {formatDate(prediction.date)}
              </div>
              
              <div className="result-emission">
                <div className="emission-value">
                  <span className="value-number">{prediction.emission.toFixed(2)}</span>
                  <span className="value-unit">kg CO₂</span>
                </div>
              
              {/* Breakdown Display */}
              {prediction.breakdown && (
                <div className="emission-breakdown">
                  <div className="breakdown-title">Category Breakdown:</div>
                  <div className="breakdown-items">
                    <div className="breakdown-item">
                      <span className="breakdown-icon">🚗</span>
                      <span className="breakdown-label">Transport:</span>
                      <span className="breakdown-value">{prediction.breakdown.transport.toFixed(2)} kg</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-icon">💡</span>
                      <span className="breakdown-label">Electricity:</span>
                      <span className="breakdown-value">{prediction.breakdown.electricity.toFixed(2)} kg</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-icon">🍽️</span>
                      <span className="breakdown-label">Food:</span>
                      <span className="breakdown-value">{prediction.breakdown.food.toFixed(2)} kg</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-icon">🗑️</span>
                      <span className="breakdown-label">Waste:</span>
                      <span className="breakdown-value">{prediction.breakdown.waste.toFixed(2)} kg</span>
                    </div>
                  </div>
                </div>
              )}
                <div className={`confidence-badge ${getConfidenceBadge(prediction.confidence).class}`}>
                  <span>{getConfidenceBadge(prediction.confidence).icon}</span>
                  <span>{getConfidenceBadge(prediction.confidence).label}</span>
                </div>
              </div>
              
              <div className="result-details">
                <p>
                  <strong>Based on:</strong> {prediction.daysUsed} recent day{prediction.daysUsed !== 1 ? 's' : ''} of activity
                </p>
                {prediction.demo && (
                  <p className="demo-mode-badge">
                    🔹 Demo Mode - ML service unavailable or insufficient data
                  </p>
                )}
                {prediction.message && (
                  <p className="result-note">{prediction.message}</p>
                )}
              </div>
              
              <div className="result-explanation">
                <h5>ℹ️ How it works:</h5>
                <ul>
                  <li>Analyzes your recent emission patterns (last 10-20 days)</li>
                  <li>Uses machine learning behavioral trend model</li>
                  <li>More history = higher prediction confidence</li>
                  <li>Must be confirmed before saving to database</li>
                  <li>Marked as "ML Predicted" in your activity log</li>
                </ul>
              </div>
              
              <div className="result-actions">
                <button 
                  className="btn-cancel"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  className="btn-save"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="btn-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      Confirm & Save
                    </>
                  )}
                </button>
              </div>
              
              <div className="prediction-disclaimer">
                ⚠️ This is an estimate. Predictions are marked as "ML Predicted" in your activity log.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PredictionCard;
