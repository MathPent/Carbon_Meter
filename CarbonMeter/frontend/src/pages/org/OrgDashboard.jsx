import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './OrgDashboard.css';
import api from '../../api';
import AnalyticsAndReports from '../../components/org/AnalyticsAndReports';

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/org/dashboard', {
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
