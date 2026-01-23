import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import GovNavbar from '../../components/gov/GovNavbar';
import './GovAnalytics.css';

const GovAnalytics = () => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    monthlyTrend: [],
    categoryBreakdown: [],
    weeklyComparison: [],
    insights: [],
    totalEmission: 0,
    avgDailyEmission: 0,
  });
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/gov/analytics?days=${timeRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#1a365d', '#2c5282', '#2b6cb0', '#3182ce', '#4299e1', '#63b3ed'];

  if (loading) {
    return (
      <>
        <GovNavbar />
        <div className="gov-loading">
          <div className="gov-spinner"></div>
          <p>Loading Analytics...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <GovNavbar />
      <div className="gov-analytics">
        {/* Header */}
        <div className="analytics-header">
          <div>
            <h1>Department Analytics</h1>
            <p>Comprehensive emission analysis and insights</p>
          </div>
          <div className="time-range-selector">
            <button
              className={timeRange === '7' ? 'active' : ''}
              onClick={() => setTimeRange('7')}
            >
              7 Days
            </button>
            <button
              className={timeRange === '30' ? 'active' : ''}
              onClick={() => setTimeRange('30')}
            >
              30 Days
            </button>
            <button
              className={timeRange === '90' ? 'active' : ''}
              onClick={() => setTimeRange('90')}
            >
              90 Days
            </button>
            <button
              className={timeRange === '365' ? 'active' : ''}
              onClick={() => setTimeRange('365')}
            >
              1 Year
            </button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="analytics-kpis">
          <div className="kpi-card">
            <div className="kpi-icon">📊</div>
            <div>
              <h3>Total Emissions</h3>
              <p className="kpi-value">{(analytics.totalEmission / 1000).toFixed(2)}</p>
              <span className="kpi-unit">tonnes CO₂e</span>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon">📈</div>
            <div>
              <h3>Average Daily</h3>
              <p className="kpi-value">{analytics.avgDailyEmission.toFixed(2)}</p>
              <span className="kpi-unit">kg CO₂e/day</span>
            </div>
          </div>
        </div>

        {/* Monthly Trend Area Chart */}
        <div className="analytics-chart-card full-width">
          <h3>📉 Emission Trend Over Time</h3>
          {analytics.monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={analytics.monthlyTrend}>
                <defs>
                  <linearGradient id="colorEmission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2c5282" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2c5282" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  stroke="#718096"
                  style={{ fontSize: '0.85rem' }}
                />
                <YAxis
                  stroke="#718096"
                  style={{ fontSize: '0.85rem' }}
                  label={{ value: 'kg CO₂e', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="emission"
                  stroke="#2c5282"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorEmission)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No trend data available</div>
          )}
        </div>

        {/* Category Breakdown & Weekly Comparison */}
        <div className="analytics-charts-grid">
          <div className="analytics-chart-card">
            <h3>🥧 Category Distribution</h3>
            {analytics.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No category data available</div>
            )}
          </div>

          <div className="analytics-chart-card">
            <h3>📊 Weekly Comparison</h3>
            {analytics.weeklyComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.weeklyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="week"
                    stroke="#718096"
                    style={{ fontSize: '0.85rem' }}
                  />
                  <YAxis
                    stroke="#718096"
                    style={{ fontSize: '0.85rem' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="emission" fill="#2c5282" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No weekly data available</div>
            )}
          </div>
        </div>

        {/* Insights Panel */}
        <div className="insights-panel">
          <h3>💡 Key Insights</h3>
          {analytics.insights && analytics.insights.length > 0 ? (
            <div className="insights-list">
              {analytics.insights.map((insight, index) => (
                <div key={index} className="insight-item">
                  <span className="insight-icon">
                    {insight.type === 'warning' && '⚠️'}
                    {insight.type === 'success' && '✅'}
                    {insight.type === 'info' && 'ℹ️'}
                  </span>
                  <p>{insight.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">
              No insights available yet. Log more activities to generate insights.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GovAnalytics;
