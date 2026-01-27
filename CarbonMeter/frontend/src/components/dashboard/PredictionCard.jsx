import React, { useState, useEffect } from 'react';
import api from '../../api';
import './PredictionCard.css';

const PredictionCard = () => {
  const [missingDays, setMissingDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMissingDays();
  }, []);

  const fetchMissingDays = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prediction/missing-days');
      
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
      
      const response = await api.post('/prediction/predict-missing-day', { date });
      
      if (response.data.success) {
        setPrediction({
          date,
          emission: response.data.predictedEmission,
          confidence: response.data.confidence,
          daysUsed: response.data.daysUsed,
          message: response.data.message
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
      
      const response = await api.post('/prediction/save-predicted-emission', {
        date: prediction.date,
        predictedEmission: prediction.emission
      });
      
      if (response.data.success) {
        alert('✅ Prediction saved successfully!');
        
        // Remove saved date from missing days
        setMissingDays(prev => prev.filter(d => d !== prediction.date));
        
        // Clear prediction
        setPrediction(null);
        setSelectedDate(null);
        
        // Optionally refresh dashboard
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
    const badges = {
      low: { icon: '⚠️', label: 'Low Confidence', class: 'confidence-low' },
      medium: { icon: '📊', label: 'Medium Confidence', class: 'confidence-medium' },
      high: { icon: '✅', label: 'High Confidence', class: 'confidence-high' }
    };
    return badges[confidence] || badges.low;
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
                {missingDays.slice(0, 5).map((date) => (
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
                <p className="more-dates">+ {missingDays.length - 5} more dates</p>
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
                <div className={`confidence-badge ${getConfidenceBadge(prediction.confidence).class}`}>
                  <span>{getConfidenceBadge(prediction.confidence).icon}</span>
                  <span>{getConfidenceBadge(prediction.confidence).label}</span>
                </div>
              </div>
              
              <div className="result-details">
                <p>
                  <strong>Based on:</strong> {prediction.daysUsed} recent day{prediction.daysUsed !== 1 ? 's' : ''} of activity
                </p>
                {prediction.message && (
                  <p className="result-note">{prediction.message}</p>
                )}
              </div>
              
              <div className="result-explanation">
                <h5>ℹ️ How it works:</h5>
                <ul>
                  <li>Analyzes your recent emission patterns</li>
                  <li>Uses machine learning to predict similar days</li>
                  <li>More history = higher confidence</li>
                  <li>Must be confirmed before saving</li>
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
