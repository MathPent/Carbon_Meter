import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './TipsPage.css';

const TipsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState([]);
  const [emissionSummary, setEmissionSummary] = useState(null);
  const [viewMode, setViewMode] = useState('personalized'); // 'personalized' or 'general'
  const [generatedAt, setGeneratedAt] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTips();
  }, [viewMode]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await api.get('/tips/personalized?force=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setTips(response.data.tips || []);
        setEmissionSummary(response.data.emissionSummary || null);
        setGeneratedAt(response.data.generatedAt);
      } else {
        throw new Error('Failed to refresh tips');
      }
    } catch (err) {
      setError('Failed to refresh tips. Please try again.');
      console.error('Error refreshing tips:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchTips = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const endpoint = viewMode === 'personalized' 
        ? '/tips/personalized'
        : '/tips/general';

      const response = await api.get(endpoint);

      if (response.data.success) {
        setTips(response.data.tips || []);
        setEmissionSummary(response.data.emissionSummary || null);
        setGeneratedAt(response.data.generatedAt || null);
        
        if (response.data.message) {
          setError(response.data.message);
        }
      }
    } catch (error) {
      console.error('Error fetching tips:', error);
      setError('Unable to load tips. Please try again later.');
      setTips([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Transport: '🚗',
      Electricity: '⚡',
      Food: '🍽️',
      Waste: '♻️',
      General: '🌍'
    };
    return icons[category] || '💡';
  };

  const getImpactColor = (impact) => {
    const colors = {
      High: 'impact-high',
      Medium: 'impact-medium',
      Low: 'impact-low'
    };
    return colors[impact] || 'impact-medium';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Easy: 'difficulty-easy',
      Medium: 'difficulty-medium',
      Hard: 'difficulty-hard'
    };
    return colors[difficulty] || 'difficulty-medium';
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupTipsByCategory = () => {
    const grouped = {
      Transport: [],
      Electricity: [],
      Food: [],
      Waste: [],
      General: []
    };

    tips.forEach(tip => {
      if (grouped[tip.category]) {
        grouped[tip.category].push(tip);
      }
    });

    return grouped;
  };

  const groupedTips = groupTipsByCategory();

  return (
    <div className="tips-page">
      <div className="tips-header">
        <h1>💡 Smart Carbon Reduction Tips</h1>
        <p>Personalized recommendations based on your emission data</p>
      </div>

      {/* View Toggle and Refresh */}
      <div className="tips-controls">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'personalized' ? 'active' : ''}`}
            onClick={() => setViewMode('personalized')}
          >
            🎯 My Tips
          </button>
          <button
            className={`toggle-btn ${viewMode === 'general' ? 'active' : ''}`}
            onClick={() => setViewMode('general')}
          >
            🌐 General Tips
          </button>
        </div>
      
        {/* Refresh Button - only show for personalized view */}
        {viewMode === 'personalized' && (
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh tips based on latest activities"
          >
            <span className="refresh-icon">{refreshing ? '⏳' : '🔄'}</span>
            {refreshing ? 'Refreshing...' : 'Refresh Tips'}
          </button>
        )}
      </div>

      {/* Emission Summary (for personalized tips only) */}
      {viewMode === 'personalized' && emissionSummary && (
        <div className="emission-summary-card">
          <h3>Your Emission Overview (Last 24 Hours)</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total Emissions</span>
              <span className="stat-value">{emissionSummary.totalEmissions} kg CO₂</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Highest Category</span>
              <span className="stat-value">
                {getCategoryIcon(emissionSummary.highestCategory)} {emissionSummary.highestCategory} ({emissionSummary.highestPercentage}%)
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Activities Logged</span>
              <span className="stat-value">{emissionSummary.activityCount}</span>
            </div>
          </div>
          {generatedAt && (
            <div className="generated-timestamp">
              Generated: {formatDate(generatedAt)}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="info-message">
          <span className="info-icon">ℹ️</span>
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Generating your personalized tips...</p>
        </div>
      ) : tips.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No Tips Available</h3>
          <p>Start logging your daily activities to get personalized recommendations</p>
          <button
            className="btn-calculate"
            onClick={() => navigate('/calculate')}
          >
            📊 Log Activity
          </button>
        </div>
      ) : (
        <div className="tips-container">
          {/* Render tips by category */}
          {Object.keys(groupedTips).map(category => {
            if (groupedTips[category].length === 0) return null;

            return (
              <div key={category} className="category-section">
                <div className="category-header">
                  <span className="category-icon">{getCategoryIcon(category)}</span>
                  <h2>{category}</h2>
                  <span className="tip-count">{groupedTips[category].length} tips</span>
                </div>

                <div className="tips-grid">
                  {groupedTips[category].map((tip, index) => (
                    <div key={index} className="tip-card">
                      <div className="tip-header">
                        <span className="tip-icon">{getCategoryIcon(tip.category)}</span>
                        <div className="tip-badges">
                          <span className={`badge impact-badge ${getImpactColor(tip.impact)}`}>
                            {tip.impact} Impact
                          </span>
                          <span className={`badge difficulty-badge ${getDifficultyColor(tip.difficulty)}`}>
                            {tip.difficulty}
                          </span>
                        </div>
                      </div>
                      <p className="tip-text">{tip.tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Disclaimer */}
      {viewMode === 'personalized' && tips.length > 0 && (
        <div className="ai-disclaimer">
          <span className="disclaimer-icon">🤖</span>
          <p>
            These tips are AI-generated based on your actual emission data from manual logging. 
            Tips refresh every 24 hours. For best results, log your activities regularly.
          </p>
        </div>
      )}
    </div>
  );
};

export default TipsPage;
