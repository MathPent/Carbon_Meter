import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import API_BASE_URL from '../config/api.config';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [emissions, setEmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Fetch dashboard stats
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'emissions') {
      fetchEmissions();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
          return;
        }
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/users?page=1&limit=100`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchEmissions = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/emissions?timeframe=30`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch emissions');
      }

      const data = await response.json();
      setEmissions(data.emissions);
    } catch (err) {
      console.error('Error fetching emissions:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    sessionStorage.clear();
    navigate('/', { replace: true });
  };

  const handleRefresh = () => {
    // Refresh stats (always needed for overview)
    fetchStats();
    
    // Refresh current tab data
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'emissions') {
      fetchEmissions();
    }
  };

  if (loading && !stats) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>🛡️ Admin Portal</h2>
          <p className="admin-role">System Administrator</p>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            Overview
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            User Management
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'emissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('emissions')}
          >
            <span className="nav-icon">🌍</span>
            Emissions Monitor
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'chatbot' ? 'active' : ''}`}
            onClick={() => setActiveTab('chatbot')}
          >
            <span className="nav-icon">🤖</span>
            AI Monitoring
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="nav-icon">📈</span>
            Analytics
          </button>
        </nav>

        <button className="admin-logout-btn" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-header">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <button className="refresh-btn" onClick={handleRefresh}>
            🔄 Refresh
          </button>
        </div>

        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="overview-content">
            <div className="stats-grid">
              {/* Users Stats */}
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-icon">👥</span>
                  <h3>Total Users</h3>
                </div>
                <div className="stat-value">{stats.users.total.toLocaleString()}</div>
                <div className="stat-details">
                  <div>Active (24h): {stats.users.active24h}</div>
                  <div className="role-breakdown">
                    <span>Individual: {stats.users.individual}</span>
                    <span>NGO: {stats.users.ngo}</span>
                    <span>Government: {stats.users.government}</span>
                  </div>
                </div>
              </div>

              {/* Emissions Stats */}
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-icon">🌍</span>
                  <h3>Total Emissions</h3>
                </div>
                <div className="stat-value">
                  {((stats.emissions.total || 0) / 1000).toFixed(2)} tons
                </div>
                <div className="stat-details">
                  <div>Today: {(stats.emissions.today || 0).toFixed(2)} kg CO₂</div>
                  <div className="emissions-trend">
                    {stats.emissions.monthlyTrend && stats.emissions.monthlyTrend.length > 0 && stats.emissions.monthlyTrend[0].total && (
                      <span>
                        This month: {stats.emissions.monthlyTrend[0].total.toFixed(2)} kg
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Chatbot Stats */}
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-icon">🤖</span>
                  <h3>AI Chatbot</h3>
                </div>
                <div className="stat-value">
                  {stats.chatbot.totalConversations.toLocaleString()} chats
                </div>
                <div className="stat-details">
                  <div>Today: {stats.chatbot.todayQueries} queries</div>
                  <div>Status: <span className="status-active">● Active</span></div>
                </div>
              </div>
            </div>

            {/* Monthly Emissions Chart */}
            {stats.emissions.monthlyTrend && stats.emissions.monthlyTrend.length > 0 && (
              <div className="chart-section">
                <h3>Monthly Emissions Trend</h3>
                <div className="emissions-chart">
                  {stats.emissions.monthlyTrend.map((month, index) => {
                    const monthTotal = month.total || 0;
                    const maxTotal = Math.max(...stats.emissions.monthlyTrend.map(m => m.total || 0));
                    return (
                      <div key={index} className="chart-bar">
                        <div 
                          className="bar-fill"
                          style={{
                            height: maxTotal > 0 ? `${(monthTotal / maxTotal) * 100}%` : '0%'
                          }}
                        ></div>
                        <div className="bar-label">
                          {new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="bar-value">{(monthTotal / 1000).toFixed(1)}t</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-content">
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                          {user.role || 'Individual'}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>{new Date(user.updatedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="empty-state">No users found</div>
              )}
            </div>
          </div>
        )}

        {/* Emissions Tab */}
        {activeTab === 'emissions' && (
          <div className="emissions-content">
            <div className="emissions-summary">
              <h3>Emissions by Category (Last 30 Days)</h3>
              <div className="emissions-grid">
                {emissions.map((item) => (
                  <div key={item._id} className="emission-card">
                    <div className="emission-category">{item._id || 'Uncategorized'}</div>
                    <div className="emission-value">{(item.total || 0).toFixed(2)} kg CO₂</div>
                    <div className="emission-count">{item.count || 0} activities</div>
                  </div>
                ))}
              </div>
              {emissions.length === 0 && (
                <div className="empty-state">No emission data available</div>
              )}
            </div>
          </div>
        )}

        {/* Chatbot Tab */}
        {activeTab === 'chatbot' && stats && (
          <div className="chatbot-content">
            <div className="chatbot-stats">
              <div className="stat-card">
                <h3>CarBox AI System Status</h3>
                <div className="status-info">
                  <div className="status-row">
                    <span>Total Conversations:</span>
                    <span>{stats.chatbot.totalConversations}</span>
                  </div>
                  <div className="status-row">
                    <span>Today's Queries:</span>
                    <span>{stats.chatbot.todayQueries}</span>
                  </div>
                  <div className="status-row">
                    <span>API Status:</span>
                    <span className="status-active">● Operational</span>
                  </div>
                  <div className="status-row">
                    <span>Model:</span>
                    <span>Deepseek V3P2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && stats && (
          <div className="analytics-content">
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>User Growth</h3>
                <div className="analytics-value">{stats.users.total}</div>
                <div className="analytics-subtitle">Total registered users</div>
              </div>
              <div className="analytics-card">
                <h3>Engagement Rate</h3>
                <div className="analytics-value">
                  {stats.users.total > 0 
                    ? ((stats.users.active24h / stats.users.total) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="analytics-subtitle">Active in last 24 hours</div>
              </div>
              <div className="analytics-card">
                <h3>Avg. Emissions</h3>
                <div className="analytics-value">
                  {stats.users.total > 0
                    ? ((stats.emissions.total || 0) / stats.users.total).toFixed(2)
                    : 0} kg
                </div>
                <div className="analytics-subtitle">Per user (all time)</div>
              </div>
              <div className="analytics-card">
                <h3>AI Usage</h3>
                <div className="analytics-value">
                  {stats.users.total > 0
                    ? (stats.chatbot.totalConversations / stats.users.total).toFixed(1)
                    : 0}
                </div>
                <div className="analytics-subtitle">Chats per user</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
