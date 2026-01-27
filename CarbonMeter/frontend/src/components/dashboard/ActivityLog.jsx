import React, { useState, useEffect } from 'react';
import api from '../../api';
import './ActivityLog.css';

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [dateFilter, setDateFilter] = useState({
    manual: 'all',
    quick: 'all',
    map: 'all',
    live: 'all',
    ml: 'all'
  });

  useEffect(() => {
    fetchActivities();
  }, [page]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 100 // Increased to get more data for grouping
      };

      const response = await api.get('/activities/history', { params });
      
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

  const formatDateHeader = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  };

  const getDateOnly = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const groupActivitiesByDate = (activitiesList) => {
    const grouped = {};
    activitiesList.forEach(activity => {
      const dateKey = getDateOnly(activity.date || activity.createdAt);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });
    return grouped;
  };

  const filterActivitiesByDate = (activitiesList, filterDate) => {
    if (filterDate === 'all') return activitiesList;
    if (filterDate === 'today') {
      const today = getDateOnly(new Date());
      return activitiesList.filter(a => getDateOnly(a.date || a.createdAt) === today);
    }
    if (filterDate === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getDateOnly(yesterday);
      return activitiesList.filter(a => getDateOnly(a.date || a.createdAt) === yesterdayStr);
    }
    // Custom date
    return activitiesList.filter(a => getDateOnly(a.date || a.createdAt) === filterDate);
  };

  const calculateDayTotal = (activitiesList) => {
    return activitiesList.reduce((sum, activity) => sum + (activity.carbonEmission || 0), 0);
  };

  const renderDateFilter = (sectionType) => {
    return (
      <div className="date-filter-container">
        <div className="date-filter-buttons">
          <button 
            className={`date-filter-btn ${dateFilter[sectionType] === 'all' ? 'active' : ''}`}
            onClick={() => setDateFilter({...dateFilter, [sectionType]: 'all'})}
          >
            All Dates
          </button>
          <button 
            className={`date-filter-btn ${dateFilter[sectionType] === 'today' ? 'active' : ''}`}
            onClick={() => setDateFilter({...dateFilter, [sectionType]: 'today'})}
          >
            📅 Today
          </button>
          <button 
            className={`date-filter-btn ${dateFilter[sectionType] === 'yesterday' ? 'active' : ''}`}
            onClick={() => setDateFilter({...dateFilter, [sectionType]: 'yesterday'})}
          >
            📅 Yesterday
          </button>
          <input
            type="date"
            className="date-picker-input"
            value={dateFilter[sectionType] !== 'all' && dateFilter[sectionType] !== 'today' && dateFilter[sectionType] !== 'yesterday' ? dateFilter[sectionType] : ''}
            onChange={(e) => setDateFilter({...dateFilter, [sectionType]: e.target.value})}
          />
          {dateFilter[sectionType] !== 'all' && (
            <button 
              className="clear-filter-btn"
              onClick={() => setDateFilter({...dateFilter, [sectionType]: 'all'})}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderActivityCard = (activity, additionalClass = '') => {
    return (
      <div 
        key={activity._id} 
        className={`activity-card ${additionalClass}`}
      >
        <div className="activity-card-header">
          <div className="activity-category-icon">
            {getCategoryIcon(activity.category)}
          </div>
          <div className="activity-meta">
            <span className={`activity-type-badge ${additionalClass ? additionalClass.split('-')[0] + '-badge' : ''}`}>
              {activity.logType === 'ML Predicted' && '🤖 ML Predicted'}
              {activity.logType === 'quick' && '⚡ Quick Estimator'}
              {activity.logType === 'automatic' && activity.transportData?.isMapBased && '🗺️ Map Based'}
              {activity.logType === 'automatic' && activity.transportData?.isLiveTracking && '📍 Live Tracking'}
              {activity.logType === 'manual' && getActivityType(activity.logType)}
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
    );
  };

  const renderActivitiesByDate = (activitiesList, cardClass = '') => {
    const grouped = groupActivitiesByDate(activitiesList);
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

    return sortedDates.map(dateKey => (
      <div key={dateKey} className="date-group">
        <div className="date-group-header">
          <span className="date-icon">📅</span>
          <h4 className="date-title">{formatDateHeader(dateKey)}</h4>
          <span className="date-total">
            Total: {calculateDayTotal(grouped[dateKey]).toFixed(2)} kg CO₂
          </span>
        </div>
        <div className="activities-grid">
          {grouped[dateKey].map((activity) => renderActivityCard(activity, cardClass))}
        </div>
      </div>
    ));
  };

  return (
    <div className="activity-log-container">
      <div className="activity-log-header">
        <h2>📋 Activity Log</h2>
        <p>View all your saved emission records</p>
      </div>

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
          {/* Manual Logging Section */}
          {activities.filter(a => a.logType === 'manual').length > 0 && (
            <div className="activity-section">
              <div className="section-header">
                <h3>✍️ Manual Logging</h3>
                <span className="section-count">
                  {activities.filter(a => a.logType === 'manual').length} entries
                </span>
              </div>
              {renderDateFilter('manual')}
              {renderActivitiesByDate(filterActivitiesByDate(activities.filter(a => a.logType === 'manual'), dateFilter.manual))}
            </div>
          )}

          {/* Quick Footprint Estimator Section */}
          {activities.filter(a => a.logType === 'quick').length > 0 && (
            <div className="activity-section quick-section">
              <div className="section-header">
                <h3>⚡ Quick Footprint Estimator</h3>
                <span className="section-count quick-count">
                  {activities.filter(a => a.logType === 'quick').length} estimates
                </span>
              </div>
              {renderDateFilter('quick')}
              {renderActivitiesByDate(filterActivitiesByDate(activities.filter(a => a.logType === 'quick'), dateFilter.quick), 'quick-card')}
            </div>
          )}

          {/* Map Based Transport Section */}
          {activities.filter(a => a.logType === 'automatic' && a.transportData?.isMapBased).length > 0 && (
            <div className="activity-section map-section">
              <div className="section-header">
                <h3>🗺️ Map Based Transport</h3>
                <span className="section-count map-count">
                  {activities.filter(a => a.logType === 'automatic' && a.transportData?.isMapBased).length} routes
                </span>
              </div>
              {renderDateFilter('map')}
              {renderActivitiesByDate(filterActivitiesByDate(activities.filter(a => a.logType === 'automatic' && a.transportData?.isMapBased), dateFilter.map), 'map-card')}
            </div>
          )}

          {/* Live Transport Tracking Section */}
          {activities.filter(a => a.logType === 'automatic' && a.transportData?.isLiveTracking).length > 0 && (
            <div className="activity-section live-section">
              <div className="section-header">
                <h3>📍 Live Transport Tracking</h3>
                <span className="section-count live-count">
                  {activities.filter(a => a.logType === 'automatic' && a.transportData?.isLiveTracking).length} tracks
                </span>
              </div>
              {renderDateFilter('live')}
              {renderActivitiesByDate(filterActivitiesByDate(activities.filter(a => a.logType === 'automatic' && a.transportData?.isLiveTracking), dateFilter.live), 'live-card')}
            </div>
          )}

          {/* ML Predictions Section */}
          {activities.filter(a => a.logType === 'ML Predicted').length > 0 && (
            <div className="activity-section ml-section">
              <div className="section-header">
                <h3>🤖 ML Predictions</h3>
                <span className="section-count ml-count">
                  {activities.filter(a => a.logType === 'ML Predicted').length} predictions
                </span>
              </div>
              {renderDateFilter('ml')}
              {renderActivitiesByDate(filterActivitiesByDate(activities.filter(a => a.logType === 'ML Predicted'), dateFilter.ml), 'predicted')}
            </div>
          )}

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
