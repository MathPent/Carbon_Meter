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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import GovNavbar from '../../components/gov/GovNavbar';
import './GovDashboard.css';

const GovDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      todayEmission: 0,
      monthlyEmission: 0,
      yearlyEmission: 0,
      topActivity: '',
    },
    dailyEmissions: [],
    categoryBreakdown: [],
    weeklyTrend: [],
    recentActivities: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/gov/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
          <p>Loading Dashboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <GovNavbar />
      <div className="gov-dashboard">
        {/* Header */}
        <div className="gov-dashboard-header">
          <div>
            <h1>Government Dashboard</h1>
            <p>Real-time carbon emission monitoring and analytics</p>
          </div>
          <button className="refresh-btn" onClick={fetchDashboardData}>
            <span>🔄</span> Refresh Data
          </button>
        </div>

        {/* KPI Cards */}
        <div className="gov-kpi-grid">
          <div className="gov-kpi-card today">
            <div className="kpi-icon">📅</div>
            <div className="kpi-content">
              <h3>Today's Emissions</h3>
              <p className="kpi-value">{dashboardData.kpis.todayEmission.toFixed(2)}</p>
              <span className="kpi-unit">kg CO₂e</span>
            </div>
          </div>

          <div className="gov-kpi-card month">
            <div className="kpi-icon">📊</div>
            <div className="kpi-content">
              <h3>Monthly Emissions</h3>
              <p className="kpi-value">{dashboardData.kpis.monthlyEmission.toFixed(2)}</p>
              <span className="kpi-unit">kg CO₂e</span>
            </div>
          </div>

          <div className="gov-kpi-card year">
            <div className="kpi-icon">📈</div>
            <div className="kpi-content">
              <h3>Yearly Emissions</h3>
              <p className="kpi-value">{(dashboardData.kpis.yearlyEmission / 1000).toFixed(2)}</p>
              <span className="kpi-unit">tonnes CO₂e</span>
            </div>
          </div>

          <div className="gov-kpi-card activity">
            <div className="kpi-icon">🎯</div>
            <div className="kpi-content">
              <h3>Top Emitting Activity</h3>
              <p className="kpi-value-text">{dashboardData.kpis.topActivity || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="gov-charts-section">
          {/* Daily Emissions Line Chart */}
          <div className="gov-chart-card full-width">
            <h3>📉 Daily Emissions Trend (Last 30 Days)</h3>
            {dashboardData.dailyEmissions.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.dailyEmissions}>
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
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="emission"
                    stroke="#2c5282"
                    strokeWidth={3}
                    dot={{ fill: '#f6ad55', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No emission data available for the last 30 days</div>
            )}
          </div>

          {/* Category Breakdown Pie Chart */}
          <div className="gov-chart-card">
            <h3>🥧 Emissions by Category</h3>
            {dashboardData.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">No category breakdown available</div>
            )}
          </div>

          {/* Weekly Trend Bar Chart */}
          <div className="gov-chart-card">
            <h3>📊 Weekly Emissions Trend</h3>
            {dashboardData.weeklyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.weeklyTrend}>
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
              <div className="no-data">No weekly trend data available</div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="gov-recent-activities">
          <h3>📝 Recent Activities</h3>
          {dashboardData.recentActivities.length > 0 ? (
            <div className="activities-list">
              {dashboardData.recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {activity.category === 'Transport' && '🚗'}
                    {activity.category === 'Electricity' && '⚡'}
                    {activity.category === 'Waste' && '🗑️'}
                    {activity.category === 'Industrial' && '🏭'}
                  </div>
                  <div className="activity-details">
                    <h4>{activity.category}</h4>
                    <p>{activity.description}</p>
                    <span className="activity-date">{new Date(activity.date).toLocaleDateString()}</span>
                  </div>
                  <div className="activity-emission">
                    <span className="emission-value">{activity.carbonEmission.toFixed(2)}</span>
                    <span className="emission-unit">kg CO₂e</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No activities logged yet. Start by logging your first activity!</div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="gov-quick-actions">
          <h3>⚡ Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn primary" onClick={() => window.location.href = '/gov/log-activity'}>
              <span>📝</span> Log New Activity
            </button>
            <button className="action-btn secondary" onClick={() => window.location.href = '/gov/analytics'}>
              <span>📈</span> View Analytics
            </button>
            <button className="action-btn secondary" onClick={() => window.location.href = '/gov/reports'}>
              <span>📄</span> Generate Report
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GovDashboard;
