import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import GovNavbar from '../../components/gov/GovNavbar';
import './GovReports.css';

const GovReports = () => {
  const { token } = useContext(AuthContext);
  const [reportType, setReportType] = useState('monthly');
  const [format, setFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setMessage('');

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/gov/reports/generate`,
        {
          reportType,
          format,
          dateRange,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob', // Important for file download
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `carbon-report-${reportType}-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage('✅ Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      setMessage('❌ Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reportTemplates = [
    {
      type: 'monthly',
      icon: '📅',
      title: 'Monthly Report',
      description: 'Comprehensive monthly emission summary with trends and insights',
    },
    {
      type: 'quarterly',
      icon: '📊',
      title: 'Quarterly Report',
      description: 'Quarterly analysis with comparative data and performance metrics',
    },
    {
      type: 'annual',
      icon: '📈',
      title: 'Annual Report',
      description: 'Year-end comprehensive report with full breakdown and projections',
    },
    {
      type: 'custom',
      icon: '🎯',
      title: 'Custom Report',
      description: 'Generate reports for specific date ranges and categories',
    },
  ];

  return (
    <>
      <GovNavbar />
      <div className="gov-reports">
        {/* Header */}
        <div className="reports-header">
          <div>
            <h1>Government Reports</h1>
            <p>Generate and download comprehensive emission reports</p>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`message-banner ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {/* Report Templates */}
        <div className="report-templates">
          <h3>Select Report Type</h3>
          <div className="template-grid">
            {reportTemplates.map((template) => (
              <button
                key={template.type}
                className={`template-card ${reportType === template.type ? 'selected' : ''}`}
                onClick={() => setReportType(template.type)}
              >
                <span className="template-icon">{template.icon}</span>
                <h4>{template.title}</h4>
                <p>{template.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Report Configuration */}
        <div className="report-config">
          <h3>Configure Report</h3>
          
          <div className="config-grid">
            {/* Format Selection */}
            <div className="config-section">
              <label>Export Format</label>
              <div className="format-buttons">
                <button
                  className={format === 'pdf' ? 'active' : ''}
                  onClick={() => setFormat('pdf')}
                >
                  📄 PDF
                </button>
                <button
                  className={format === 'csv' ? 'active' : ''}
                  onClick={() => setFormat('csv')}
                >
                  📊 CSV
                </button>
                <button
                  className={format === 'xlsx' ? 'active' : ''}
                  onClick={() => setFormat('xlsx')}
                >
                  📗 Excel
                </button>
              </div>
            </div>

            {/* Custom Date Range (if custom selected) */}
            {reportType === 'custom' && (
              <div className="config-section date-range">
                <label>Date Range</label>
                <div className="date-inputs">
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    placeholder="Start Date"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    placeholder="End Date"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            className="generate-btn"
            onClick={handleGenerateReport}
            disabled={loading || (reportType === 'custom' && (!dateRange.startDate || !dateRange.endDate))}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Generating Report...
              </>
            ) : (
              <>
                <span>📥</span>
                Generate & Download Report
              </>
            )}
          </button>
        </div>

        {/* Report Features */}
        <div className="report-features">
          <h3>📋 What's Included in Reports</h3>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <div>
                <h4>Emission Breakdown</h4>
                <p>Category-wise and activity-wise emission analysis</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📈</span>
              <div>
                <h4>Trend Analysis</h4>
                <p>Historical trends and comparative analysis</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <div>
                <h4>Performance Metrics</h4>
                <p>KPIs and benchmarking against standards</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💡</span>
              <div>
                <h4>Insights & Recommendations</h4>
                <p>AI-driven insights for emission reduction</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🏆</span>
              <div>
                <h4>Compliance Status</h4>
                <p>Alignment with CPCB and NITI Aayog guidelines</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📍</span>
              <div>
                <h4>Geographic Distribution</h4>
                <p>Location-based emission mapping</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="reports-info">
          <h3>ℹ️ About Government Reports</h3>
          <p>
            Government reports are designed to meet official compliance requirements and
            provide comprehensive insights into your department's carbon footprint. All
            reports follow <strong>CPCB (Central Pollution Control Board)</strong> and{' '}
            <strong>NITI Aayog</strong> standards for emission calculation and reporting.
          </p>
          <p>
            Reports can be downloaded in multiple formats for easy sharing with
            stakeholders, auditors, and regulatory authorities.
          </p>
        </div>
      </div>
    </>
  );
};

export default GovReports;
