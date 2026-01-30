import React, { useState, useEffect } from 'react';
import './AnalyticsAndReports.css';
import { API_ENDPOINTS } from '../../config/api.config';

const AnalyticsAndReports = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' or 'reports'

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ORG.BASE}/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportType) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ORG.BASE}/reports/${reportType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const handleExportCSV = async (reportType) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.ORG.BASE}/reports/${reportType}/csv`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const getMonthlyData = () => {
    if (!analyticsData?.monthlyTrend) return [];
    return analyticsData.monthlyTrend.slice(-6); // Last 6 months
  };

  const getScopeBreakdown = () => {
    if (!analyticsData?.scopeBreakdown) return [];
    return [
      { name: 'Scope 1', value: analyticsData.scopeBreakdown.scope1 || 0, color: '#ef4444' },
      { name: 'Scope 2', value: analyticsData.scopeBreakdown.scope2 || 0, color: '#f59e0b' },
      { name: 'Scope 3', value: analyticsData.scopeBreakdown.scope3 || 0, color: '#3b82f6' },
    ];
  };

  const reports = [
    {
      id: 'monthly',
      title: 'Monthly Emissions Report',
      icon: '📄',
      description: 'Detailed monthly breakdown of all emission sources',
      features: ['Scope 1, 2, 3 emissions', 'Category-wise analysis', 'MoM trends'],
    },
    {
      id: 'annual',
      title: 'Annual ESG Report',
      icon: '📊',
      description: 'Comprehensive yearly sustainability report',
      features: ['Full year summary', 'GHG Protocol compliant', 'Stakeholder ready'],
    },
    {
      id: 'scope',
      title: 'Scope-wise Report',
      icon: '📋',
      description: 'Individual reports for each emission scope',
      features: ['Detailed scope analysis', 'Activity logs', 'Reduction opportunities'],
    },
    {
      id: 'credits',
      title: 'Carbon Credit Summary',
      icon: '🪙',
      description: 'Complete carbon credit transaction history',
      features: ['Credits earned/purchased/used', 'Compliance status', 'Cost analysis'],
    },
  ];

  if (loading) {
    return (
      <div className="analytics-reports-container loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="analytics-reports-container">
      {/* Section Header */}
      <div className="section-header">
        <div className="header-content">
          <h2>📊 Analytics & Reports</h2>
          <p>Insights, trends and downloadable emission reports</p>
        </div>
        <div className="tab-switcher">
          <button
            className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
          <button
            className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            📑 Reports
          </button>
        </div>
      </div>

      {/* Analytics Panel */}
      {activeTab === 'analytics' && (
        <div className="analytics-panel">
          {/* Trend Overview */}
          <div className="analytics-card trend-card">
            <div className="card-header">
              <h3>📈 Emissions Trend (Last 6 Months)</h3>
            </div>
            <div className="chart-container">
              {getMonthlyData().length > 0 ? (
                <div className="line-chart">
                  {getMonthlyData().map((month, index) => (
                    <div key={index} className="chart-bar">
                      <div
                        className="bar-fill"
                        style={{
                          height: `${(month.totalEmissions / Math.max(...getMonthlyData().map(m => m.totalEmissions))) * 100}%`,
                        }}
                      >
                        <span className="bar-label">{month.totalEmissions.toFixed(1)}</span>
                      </div>
                      <span className="bar-month">{month.month}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">No data available. Start logging emissions to see trends.</div>
              )}
            </div>
          </div>

          {/* Scope Breakdown */}
          <div className="analytics-card scope-card">
            <div className="card-header">
              <h3>🎯 Scope-wise Emissions</h3>
            </div>
            <div className="scope-breakdown">
              {getScopeBreakdown().map((scope, index) => {
                const total = getScopeBreakdown().reduce((sum, s) => sum + s.value, 0);
                const percentage = total > 0 ? ((scope.value / total) * 100).toFixed(1) : 0;
                
                return (
                  <div key={index} className="scope-item">
                    <div className="scope-info">
                      <div className="scope-name">
                        <span className="scope-dot" style={{ backgroundColor: scope.color }}></span>
                        {scope.name}
                      </div>
                      <div className="scope-values">
                        <span className="scope-value">{scope.value.toFixed(2)} tCO₂e</span>
                        <span className="scope-percentage">{percentage}%</span>
                      </div>
                    </div>
                    <div className="scope-bar">
                      <div
                        className="scope-bar-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: scope.color,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Growth/Reduction Stats */}
          <div className="analytics-card stats-card">
            <div className="card-header">
              <h3>📊 Performance Metrics</h3>
            </div>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-icon">📉</span>
                <div className="metric-content">
                  <span className="metric-label">Month-over-Month</span>
                  <span className={`metric-value ${analyticsData?.monthlyChange >= 0 ? 'negative' : 'positive'}`}>
                    {analyticsData?.monthlyChange >= 0 ? '↑' : '↓'} {Math.abs(analyticsData?.monthlyChange || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="metric-item">
                <span className="metric-icon">📈</span>
                <div className="metric-content">
                  <span className="metric-label">Year-over-Year</span>
                  <span className={`metric-value ${analyticsData?.yearlyChange >= 0 ? 'negative' : 'positive'}`}>
                    {analyticsData?.yearlyChange >= 0 ? '↑' : '↓'} {Math.abs(analyticsData?.yearlyChange || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="metric-item">
                <span className="metric-icon">🎯</span>
                <div className="metric-content">
                  <span className="metric-label">Reduction Goal</span>
                  <span className="metric-value neutral">-20% by 2030</span>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Comparison */}
          <div className="analytics-card comparison-card">
            <div className="card-header">
              <h3>⏳ Historical Comparison</h3>
            </div>
            <div className="comparison-content">
              <div className="comparison-item">
                <span className="comparison-label">Current Month</span>
                <span className="comparison-value">{analyticsData?.currentMonth?.toFixed(2) || '0.00'} tCO₂e</span>
              </div>
              <div className="comparison-item">
                <span className="comparison-label">Previous Month</span>
                <span className="comparison-value">{analyticsData?.previousMonth?.toFixed(2) || '0.00'} tCO₂e</span>
              </div>
              <div className="comparison-item">
                <span className="comparison-label">Same Month Last Year</span>
                <span className="comparison-value">{analyticsData?.lastYearMonth?.toFixed(2) || '0.00'} tCO₂e</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Panel */}
      {activeTab === 'reports' && (
        <div className="reports-panel">
          <div className="reports-grid">
            {reports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-icon">{report.icon}</div>
                <h3>{report.title}</h3>
                <p>{report.description}</p>
                <ul className="report-features">
                  {report.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
                <div className="report-actions">
                  <button className="btn-view" onClick={() => alert('View feature coming soon')}>
                    👁️ View
                  </button>
                  <button className="btn-download" onClick={() => handleDownloadReport(report.id)}>
                    📥 PDF
                  </button>
                  <button className="btn-export" onClick={() => handleExportCSV(report.id)}>
                    📊 CSV
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsAndReports;
