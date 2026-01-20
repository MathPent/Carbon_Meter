import React, { useState } from 'react';
import axios from 'axios';
import './QuickEstimator.css';

const QuickEstimator = ({ onBack }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleEstimate = async () => {
    if (!description.trim()) {
      alert('Please describe your activity');
      return;
    }

    setLoading(true);
    
    // Simple keyword-based estimation (can be replaced with AI later)
    const desc = description.toLowerCase();
    let estimate = 0;
    let category = 'general';
    let breakdown = '';

    // Transport keywords
    if (desc.includes('drive') || desc.includes('car') || desc.includes('vehicle')) {
      const kmMatch = desc.match(/(\d+)\s*km/);
      const km = kmMatch ? parseInt(kmMatch[1]) : 10;
      estimate = (km / 15) * 2.31; // Average car: 15 km/l, petrol
      category = 'transport';
      breakdown = `Estimated ${km} km drive in petrol car`;
    } else if (desc.includes('flight') || desc.includes('fly')) {
      const kmMatch = desc.match(/(\d+)\s*km/);
      const km = kmMatch ? parseInt(kmMatch[1]) : 500;
      estimate = km * 0.15;
      category = 'air travel';
      breakdown = `Estimated ${km} km flight`;
    } else if (desc.includes('electricity') || desc.includes('power')) {
      const kwhMatch = desc.match(/(\d+)\s*kwh/i);
      const kwh = kwhMatch ? parseInt(kwhMatch[1]) : 100;
      estimate = kwh * 0.82;
      category = 'electricity';
      breakdown = `Estimated ${kwh} kWh consumption`;
    } else if (desc.includes('food') || desc.includes('meal')) {
      estimate = 5; // Average meal
      category = 'food';
      breakdown = 'Estimated average meal';
    } else {
      estimate = 2; // Default estimate
      category = 'general activity';
      breakdown = 'General estimate based on description';
    }

    setTimeout(() => {
      setResult({
        emission: estimate.toFixed(2),
        category,
        breakdown,
        note: 'This is an approximate estimate. Use Manual Logging for accurate results.'
      });
      setLoading(false);
    }, 1000);
  };

  const handleSaveEstimate = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = {
        category: 'quick_estimate',
        description,
        emission: result.emission,
        estimatedCategory: result.category,
        breakdown: result.breakdown
      };

      const response = await axios.post(
        'http://localhost:5000/api/activities/log-manual',
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Estimate saved! ✅');
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error saving estimate:', error);
      alert('Failed to save estimate');
    }
  };

  return (
    <div className="quick-estimator">
      <h2 className="estimator-title">⚡ Quick Footprint Estimator</h2>
      <p className="estimator-subtitle">Describe your activity for a quick estimate</p>

      <div className="estimator-form">
        <label className="form-label">Describe Your Activity</label>
        <textarea
          className="activity-textarea"
          placeholder="e.g., Drove 50 km in my car today, Used 100 kWh electricity this month, Had chicken for lunch..."
          rows="5"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          className="btn-primary"
          onClick={handleEstimate}
          disabled={loading}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          {loading ? 'Estimating...' : '⚡ Get Quick Estimate'}
        </button>
      </div>

      {result && (
        <div className="estimate-result">
          <div className="result-header">
            <span className="result-icon">📊</span>
            <h3>Estimated Emission</h3>
          </div>

          <div className="result-value">
            <span className="value-number">{result.emission}</span>
            <span className="value-unit">kg CO₂</span>
          </div>

          <div className="result-details">
            <p><strong>Category:</strong> {result.category}</p>
            <p><strong>Breakdown:</strong> {result.breakdown}</p>
          </div>

          <div className="warning-note">
            <span className="warning-icon">⚠️</span>
            <p>{result.note}</p>
          </div>

          <div className="result-actions">
            <button className="btn-secondary" onClick={() => setResult(null)}>
              Try Again
            </button>
            <button className="btn-primary" onClick={handleSaveEstimate}>
              💾 Save This Estimate
            </button>
          </div>
        </div>
      )}

      <div className="info-box" style={{ marginTop: '2rem' }}>
        <span className="info-icon">ℹ️</span>
        <div>
          <strong>Quick Estimator:</strong> Provides approximate values based on keywords.
          <br />
          For accurate results, use Manual Logging with category-specific inputs.
        </div>
      </div>

      <button className="btn-secondary" onClick={onBack} style={{ marginTop: '2rem' }}>
        ← Back to Options
      </button>
    </div>
  );
};

export default QuickEstimator;
