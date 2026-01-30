import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './OrgDashboard.css';
import api from '../../api';
import AnalyticsAndReports from '../../components/org/AnalyticsAndReports';
import { API_ENDPOINTS } from '../../config/api.config';

const OrgDashboard = () => {
  const [stats, setStats] = useState({
    totalEmissions: 0,
    scope1: 0,
    scope2: 0,
    scope3: 0,
    perEmployee: 0,
    perRevenue: 0,
    monthlyTrend: [],
    lastUpdated: null,
  });
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [missingData, setMissingData] = useState([]);
  const [showPrediction, setShowPrediction] = useState(false);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    checkMissingData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ORG.DASHBOARD, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching org dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMissingData = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ORG.MISSING_DATA, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMissingData(data.missingDays || []);
      }
    } catch (error) {
      console.error('Error checking missing data:', error);
    }
  };

  const generatePrediction = async (period = 'next_30_days') => {
    try {
      setPredicting(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      // Get user info for organization details
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const industry = userInfo.industry || 'Manufacturing';
      
      const response = await fetch(API_ENDPOINTS.ORG.PREDICT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          period: period,
          industry: industry,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPrediction(data.prediction);
        setShowPrediction(true);
        
        // Show success message
        if (data.fallback) {
          alert('⚠️ Prediction generated using fallback calculation (ML service unavailable)');
        } else if (data.cached) {
          alert('ℹ️ Showing cached prediction (ML service unavailable)');
        } else {
          alert('✅ Prediction generated successfully!');
        }
      } else {
        const error = await response.json();
        alert('Failed to generate prediction: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating prediction:', error);
      alert('Error generating prediction. Please try again.');
    } finally {
      setPredicting(false);
    }
  };

  const savePredictionToDashboard = async () => {
    if (!prediction) {
      alert('No prediction to save!');
      return;
    }

    try {
      setPredicting(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const response = await fetch(API_ENDPOINTS.ORG.SAVE_PREDICTION, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prediction),
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('✅ Prediction saved successfully to dashboard and CSV!');
        await fetchDashboardData(); // Refresh dashboard
      } else {
        const error = await response.json();
        alert('Failed to save prediction: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving prediction:', error);
      alert('Error saving prediction. Please try again.');
    } finally {
      setPredicting(false);
    }
  };

  const fillMissingData = async () => {
    try {
      setPredicting(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.ORG.FILL_MISSING, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        await fetchDashboardData();
        await checkMissingData();
        alert('Missing data filled successfully with ML predictions!');
      }
    } catch (error) {
      console.error('Error filling missing data:', error);
      alert('Failed to fill missing data');
    } finally {
      setPredicting(false);
    }
  };

  const getEmissionLevel = (emissions) => {
    if (emissions < 100) return { level: 'low', color: '#10b981', label: 'Excellent' };
    if (emissions < 500) return { level: 'medium', color: '#f59e0b', label: 'Moderate' };
    return { level: 'high', color: '#ef4444', label: 'High' };
  };

  const emissionLevel = getEmissionLevel(stats.totalEmissions);

  if (loading) {
    return (
      <div className="org-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="org-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Organization Dashboard</h1>
          <p className="dashboard-subtitle">Track your organization's carbon footprint</p>
        </div>
        <Link to="/org/calculate" className="btn-calculate">
          <span>🧮</span> Calculate New Emissions
        </Link>
      </div>

      {/* AI Prediction Widget - New Feature */}
      {missingData.length > 0 && (
        <div className="prediction-alert">
          <div className="alert-header">
            <span className="alert-icon">🤖</span>
            <div className="alert-content">
              <h3>Missing Emission Data Detected</h3>
              <p>You have {missingData.length} day(s) without recorded emissions. Use AI to predict and fill gaps.</p>
            </div>
          </div>
          <button 
            onClick={fillMissingData} 
            className="btn-predict"
            disabled={predicting}
          >
            {predicting ? '⏳ Predicting...' : '🤖 Fill Missing Data with AI'}
          </button>
        </div>
      )}

      {/* ML Prediction Card */}
      <div className="prediction-section">
        <div className="prediction-header">
          <div>
            <h2>🔮 AI Emission Forecasting</h2>
            <p className="section-subtitle">
              ML-powered predictions for manufacturing & industrial operations
            </p>
          </div>
          <button 
            onClick={() => setShowPrediction(!showPrediction)} 
            className="btn-toggle-prediction"
          >
            {showPrediction ? '👁️ Hide Prediction' : '🤖 Show Prediction'}
          </button>
        </div>

        {showPrediction && (
          <div className="prediction-widget">
            {!prediction ? (
              <div className="prediction-empty">
                <div className="empty-icon">🎯</div>
                <h3>Generate Emission Forecast</h3>
                <p>Use our XGBoost ML model to predict future emissions based on your historical data and industry patterns.</p>
                <div className="prediction-options">
                  <button onClick={() => generatePrediction('next_30_days')} disabled={predicting} className="btn-predict-option">
                    {predicting ? '⏳ Processing...' : '📅 Next 30 Days'}
                  </button>
                  <button onClick={() => generatePrediction('next_90_days')} disabled={predicting} className="btn-predict-option">
                    {predicting ? '⏳ Processing...' : '📊 Next Quarter'}
                  </button>
                  <button onClick={() => generatePrediction('next_365_days')} disabled={predicting} className="btn-predict-option">
                    {predicting ? '⏳ Processing...' : '📈 Next Year'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="prediction-results">
                <div className="prediction-main-card">
                  <div className="prediction-value-section">
                    <div className="prediction-label">Predicted Emission</div>
                    <div className="prediction-value-large">
                      {prediction.predictedEmission?.toFixed(2) || 0}
                      <span className="unit">tCO₂e</span>
                    </div>
                    <div className="prediction-period">for {prediction.period}</div>
                    {prediction.isFallback && (
                      <div className="fallback-badge">⚠️ Fallback Calculation</div>
                    )}
                  </div>
                </div>

                <div className="prediction-stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-content">
                      <div className="stat-label">Confidence Level</div>
                      <div className="stat-value">
                        {prediction.confidence 
                          ? `${(prediction.confidence * 100).toFixed(0)}%` 
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">🏭</div>
                    <div className="stat-content">
                      <div className="stat-label">Industry</div>
                      <div className="stat-value">{prediction.industry || 'Manufacturing'}</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">⚙️</div>
                    <div className="stat-content">
                      <div className="stat-label">Model Source</div>
                      <div className="stat-value">{prediction.isFallback ? 'Fallback' : 'XGBoost ML'}</div>
                    </div>
                  </div>
                </div>

                {/* Scope Breakdown */}
                {prediction.breakdown && (
                  <div className="scope-breakdown">
                    <h4>Emission Breakdown</h4>
                    <div className="breakdown-bars">
                      <div className="breakdown-item">
                        <span className="breakdown-label">Scope 1 ({prediction.breakdown.scope1_percentage}%)</span>
                        <div className="breakdown-bar">
                          <div 
                            className="breakdown-fill scope1" 
                            style={{ width: `${prediction.breakdown.scope1_percentage}%` }}
                          ></div>
                        </div>
                        <span className="breakdown-value">{prediction.breakdown.scope1_emission?.toFixed(2)} tCO₂e</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="breakdown-label">Scope 2 ({prediction.breakdown.scope2_percentage}%)</span>
                        <div className="breakdown-bar">
                          <div 
                            className="breakdown-fill scope2" 
                            style={{ width: `${prediction.breakdown.scope2_percentage}%` }}
                          ></div>
                        </div>
                        <span className="breakdown-value">{prediction.breakdown.scope2_emission?.toFixed(2)} tCO₂e</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {prediction.recommendations && prediction.recommendations.length > 0 && (
                  <div className="recommendations-section">
                    <h4>🎯 AI Recommendations</h4>
                    <ul className="recommendations-list">
                      {prediction.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Industry Insights */}
                {prediction.industryInsights && (
                  <div className="industry-insights">
                    <h4>🏭 Industry Insights</h4>
                    <div className="insights-grid">
                      <div className="insight-item">
                        <span className="insight-label">Main Source:</span>
                        <span className="insight-value">{prediction.industryInsights.main_source}</span>
                      </div>
                      <div className="insight-item">
                        <span className="insight-label">Percentage:</span>
                        <span className="insight-value">{prediction.industryInsights.percentage}</span>
                      </div>
                      <div className="insight-item">
                        <span className="insight-label">Reduction Potential:</span>
                        <span className="insight-value">{prediction.industryInsights.reduction_potential}</span>
                      </div>
                      <div className="insight-item">
                        <span className="insight-label">Benchmark:</span>
                        <span className="insight-value">{prediction.industryInsights.benchmark}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="prediction-actions">
                  <button 
                    onClick={savePredictionToDashboard} 
                    className="btn-save-prediction"
                    disabled={predicting}
                  >
                    {predicting ? '⏳ Saving...' : '💾 Save to Dashboard'}
                  </button>
                  <button onClick={() => setPrediction(null)} className="btn-regenerate">
                    🔄 Generate New Prediction
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Main Metrics */}
      <div className="metrics-grid">
        <div className="metric-card main-metric">
          <div className="metric-header">
            <span className="metric-icon">🌍</span>
            <span className="metric-label">Total Emissions</span>
          </div>
          <div className="metric-value">
            {stats.totalEmissions.toFixed(2)}
            <span className="metric-unit">tCO₂e</span>
          </div>
          <div className="emission-gauge">
            <div 
              className="gauge-fill" 
              style={{ 
                width: `${Math.min((stats.totalEmissions / 1000) * 100, 100)}%`,
                background: emissionLevel.color 
              }}
            />
          </div>
          <div className="emission-level" style={{ color: emissionLevel.color }}>
            {emissionLevel.label}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">🚗</span>
            <span className="metric-label">Scope 1 (Direct)</span>
          </div>
          <div className="metric-value">
            {stats.scope1.toFixed(2)}
            <span className="metric-unit">tCO₂e</span>
          </div>
          <div className="metric-subtext">
            {stats.totalEmissions > 0 
              ? `${((stats.scope1 / stats.totalEmissions) * 100).toFixed(1)}% of total`
              : '0% of total'
            }
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">⚡</span>
            <span className="metric-label">Scope 2 (Energy)</span>
          </div>
          <div className="metric-value">
            {stats.scope2.toFixed(2)}
            <span className="metric-unit">tCO₂e</span>
          </div>
          <div className="metric-subtext">
            {stats.totalEmissions > 0 
              ? `${((stats.scope2 / stats.totalEmissions) * 100).toFixed(1)}% of total`
              : '0% of total'
            }
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">📦</span>
            <span className="metric-label">Scope 3 (Indirect)</span>
          </div>
          <div className="metric-value">
            {stats.scope3.toFixed(2)}
            <span className="metric-unit">tCO₂e</span>
          </div>
          <div className="metric-subtext">
            {stats.totalEmissions > 0 
              ? `${((stats.scope3 / stats.totalEmissions) * 100).toFixed(1)}% of total`
              : '0% of total'
            }
          </div>
        </div>
      </div>

      {/* Intensity Metrics */}
      <div className="intensity-grid">
        <div className="intensity-card">
          <span className="intensity-icon">👥</span>
          <div className="intensity-content">
            <div className="intensity-label">Per Employee</div>
            <div className="intensity-value">
              {stats.perEmployee.toFixed(2)}
              <span className="intensity-unit">tCO₂e</span>
            </div>
          </div>
        </div>

        <div className="intensity-card">
          <span className="intensity-icon">💰</span>
          <div className="intensity-content">
            <div className="intensity-label">Per ₹1M Revenue</div>
            <div className="intensity-value">
              {stats.perRevenue.toFixed(2)}
              <span className="intensity-unit">tCO₂e</span>
            </div>
          </div>
        </div>

        <div className="intensity-card">
          <span className="intensity-icon">🪙</span>
          <div className="intensity-content">
            <div className="intensity-label">Carbon Credits</div>
            <div className="intensity-value">
              {(stats.creditBalance || 0).toFixed(0)}
              <span className="intensity-unit">credits</span>
            </div>
          </div>
        </div>

        <div className="intensity-card">
          <span className="intensity-icon">
            {stats.complianceStatus === 'Good' ? '✅' : stats.complianceStatus === 'Warning' ? '⚠️' : '❌'}
          </span>
          <div className="intensity-content">
            <div className="intensity-label">Compliance Status</div>
            <div className="intensity-value" style={{
              color: stats.complianceStatus === 'Good' ? '#10b981' 
                : stats.complianceStatus === 'Warning' ? '#f59e0b' 
                : '#ef4444'
            }}>
              {stats.complianceStatus || 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Scope Breakdown */}
      <div className="breakdown-section">
        <h2>Emissions Breakdown</h2>
        <div className="scope-chart">
          <div className="scope-bars">
            <div className="scope-bar-item">
              <div className="scope-bar-label">
                <span>Scope 1</span>
                <span className="scope-value">{stats.scope1.toFixed(2)} tCO₂e</span>
              </div>
              <div className="scope-bar">
                <div 
                  className="scope-bar-fill scope1" 
                  style={{ 
                    width: stats.totalEmissions > 0 
                      ? `${(stats.scope1 / stats.totalEmissions) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>

            <div className="scope-bar-item">
              <div className="scope-bar-label">
                <span>Scope 2</span>
                <span className="scope-value">{stats.scope2.toFixed(2)} tCO₂e</span>
              </div>
              <div className="scope-bar">
                <div 
                  className="scope-bar-fill scope2" 
                  style={{ 
                    width: stats.totalEmissions > 0 
                      ? `${(stats.scope2 / stats.totalEmissions) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>

            <div className="scope-bar-item">
              <div className="scope-bar-label">
                <span>Scope 3</span>
                <span className="scope-value">{stats.scope3.toFixed(2)} tCO₂e</span>
              </div>
              <div className="scope-bar">
                <div 
                  className="scope-bar-fill scope3" 
                  style={{ 
                    width: stats.totalEmissions > 0 
                      ? `${(stats.scope3 / stats.totalEmissions) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Reports Section */}
      <AnalyticsAndReports />

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/org/calculate" className="action-card">
            <span className="action-icon">🧮</span>
            <h3>Calculate Emissions</h3>
            <p>Add new emission calculations</p>
          </Link>

          <Link to="/org/log-activity" className="action-card">
            <span className="action-icon">📋</span>
            <h3>View Activity Log</h3>
            <p>See all recorded emissions</p>
          </Link>

          <Link to="/org/carbon-credits" className="action-card">
            <span className="action-icon">🪙</span>
            <h3>Carbon Credits</h3>
            <p>Offset your emissions</p>
          </Link>

          <Link to="/org/compare" className="action-card">
            <span className="action-icon">⚖️</span>
            <h3>Compare</h3>
            <p>Industry benchmarking</p>
          </Link>
        </div>
      </div>

      {stats.lastUpdated && (
        <div className="last-updated">
          Last updated: {new Date(stats.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default OrgDashboard;
