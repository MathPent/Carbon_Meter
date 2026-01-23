import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ActivityLog.css';

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, Transport, Electricity, Food, Waste
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, [page, filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page,
          limit: 10,
          ...(filter !== 'all' && { category: filter })
        }
      };

      const response = await axios.get('/api/activities/history', config);
      
      if (response.data.success) {
        setActivities(response.data.activities);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
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
      Comprehensive: '🌍'
    };
    return icons[category] || '📊';
  };

  const getActivityType = (logType) => {
    const types = {
      manual: 'Manual Entry',
      automatic: 'Automatic',
      quick: 'Quick Estimator'
    };
    return types[logType] || 'Manual Entry';
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="activity-log-container">
      <div className="activity-log-header">
        <h2>📋 Activity Log</h2>
        <p>View all your saved emission records</p>
      </div>

      {/* Filter Buttons */}
      <div className="activity-filters">
        {['all', 'Transport', 'Electricity', 'Food', 'Waste'].map(cat => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => {
              setFilter(cat);
              setPage(1);
            }}
          >
            {cat === 'all' ? '🌐 All' : `${getCategoryIcon(cat)} ${cat}`}
          </button>
        ))}
      </div>

      {/* Activities List */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading activities...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No activities found</h3>
          <p>Start logging your carbon emissions using the Calculate page</p>
          <a href="/calculate" className="btn-calculate-link">
            📊 Go to Calculate
          </a>
        </div>
      ) : (
        <>
          <div className="activities-grid">
            {activities.map((activity) => (
              <div key={activity._id} className="activity-card">
                <div className="activity-card-header">
                  <div className="activity-category-icon">
                    {getCategoryIcon(activity.category)}
                  </div>
                  <div className="activity-meta">
                    <span className="activity-type-badge">
                      {getActivityType(activity.logType)}
                    </span>
                    <span className="activity-date">{formatDate(activity.date)}</span>
                  </div>
                </div>

                <div className="activity-card-body">
                  <h3 className="activity-category">
                    {activity.category}
                    {activity.transportData?.mode && ` → ${activity.transportData.mode}`}
                    {activity.comprehensiveData && ' → Comprehensive'}
                  </h3>
                  <p className="activity-description">
                    {activity.description || 'No description provided'}
                  </p>

                  {/* Show breakdown for comprehensive data */}
                  {activity.comprehensiveData?.breakdown && (
                    <div className="comprehensive-breakdown">
                      <div className="breakdown-row">
                        <span>🚗 Transport:</span>
                        <span>{activity.comprehensiveData.breakdown.transport.toFixed(2)} kg</span>
                      </div>
                      <div className="breakdown-row">
                        <span>⚡ Electricity:</span>
                        <span>{activity.comprehensiveData.breakdown.electricity.toFixed(2)} kg</span>
                      </div>
                      <div className="breakdown-row">
                        <span>🍽️ Food:</span>
                        <span>{activity.comprehensiveData.breakdown.food.toFixed(2)} kg</span>
                      </div>
                      <div className="breakdown-row">
                        <span>♻️ Waste:</span>
                        <span>{activity.comprehensiveData.breakdown.waste.toFixed(2)} kg</span>
                      </div>
                    </div>
                  )}

                  {/* Show transport details */}
                  {activity.transportData && (
                    <div className="transport-details">
                      {activity.transportData.distance && (
                        <div className="detail-item">
                          <span>📏 Distance:</span>
                          <span>{activity.transportData.distance} km</span>
                        </div>
                      )}
                      {activity.transportData.vehicleType && (
                        <div className="detail-item">
                          <span>🚙 Vehicle:</span>
                          <span>{activity.transportData.vehicleType}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="activity-card-footer">
                  <div className="emission-amount">
                    <span className="emission-label">Total Emission:</span>
                    <span className="emission-value">
                      {activity.carbonEmission.toFixed(3)} kg CO₂
                    </span>
                  </div>
                  {activity.source && (
                    <div className="activity-source">
                      <span className="source-icon">📚</span>
                      <span className="source-text">{activity.source}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {page} of {pagination.pages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityLog;
