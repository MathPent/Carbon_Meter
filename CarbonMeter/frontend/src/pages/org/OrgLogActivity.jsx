import React, { useEffect, useState } from 'react';
import './OrgLogActivity.css';
import { API_ENDPOINTS } from '../../config/api.config';

const OrgLogActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ scope: 'all', category: 'all' });
  const [stats, setStats] = useState({
    totalActivities: 0,
    scope1Count: 0,
    scope2Count: 0,
    scope3Count: 0,
  });

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      let url = `${API_ENDPOINTS.ORG.ACTIVITIES}?`;
      if (filter.scope !== 'all') url += `scope=${encodeURIComponent(filter.scope)}&`;
      if (filter.category !== 'all') url += `category=${encodeURIComponent(filter.category)}&`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      
      const data = await response.json();
      setActivities(data.activities || []);
      
      // Calculate stats
      const scope1 = data.activities.filter(a => a.scope === 'Scope 1').length;
      const scope2 = data.activities.filter(a => a.scope === 'Scope 2').length;
      const scope3 = data.activities.filter(a => a.scope === 'Scope 3').length;
      
      setStats({
        totalActivities: data.activities.length,
        scope1Count: scope1,
        scope2Count: scope2,
        scope3Count: scope3,
      });
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="org-log-activity">
        <div className="loading">Loading activities...</div>
      </div>
    );
  }

  return (
    <div className="org-log-activity">
      <div className="log-header">
        <h1>Activity Log</h1>
        <p>View all your recorded emission activities</p>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-value">{stats.totalActivities}</div>
          <div className="stat-label">Total Activities</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.scope1Count}</div>
          <div className="stat-label">Scope 1</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.scope2Count}</div>
          <div className="stat-label">Scope 2</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.scope3Count}</div>
          <div className="stat-label">Scope 3</div>
        </div>
      </div>

      <div className="log-filters">
        <select 
          value={filter.scope}
          onChange={(e) => setFilter({ ...filter, scope: e.target.value })}
          className="filter-select"
        >
          <option value="all">All Scopes</option>
          <option value="Scope 1">Scope 1 - Direct</option>
          <option value="Scope 2">Scope 2 - Energy</option>
          <option value="Scope 3">Scope 3 - Indirect</option>
        </select>
        
        <select 
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          className="filter-select"
        >
          <option value="all">All Categories</option>
          <option value="Fuel Combustion">Fuel Combustion</option>
          <option value="Company Vehicles">Company Vehicles</option>
          <option value="Electricity Consumption">Electricity</option>
          <option value="Business Travel">Business Travel</option>
          <option value="Freight & Logistics">Freight & Logistics</option>
          <option value="Waste Generated">Waste</option>
        </select>
      </div>

      {activities.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h3>No activities recorded yet</h3>
          <p>Start by calculating and logging your organization's emissions</p>
        </div>
      ) : (
        <div className="activities-list">
          {activities.map((activity) => (
            <div key={activity._id} className="activity-card">
              <div className="activity-header">
                <div className="activity-info">
                  <div className="activity-badge">{activity.scope}</div>
                  <h3>{activity.category}</h3>
                  <p className="activity-date">
                    {new Date(activity.activityDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="activity-total">
                  <div className="emission-value">
                    {activity.emissionValue.toFixed(2)}
                  </div>
                  <span className="unit">{activity.emissionUnit}</span>
                </div>
              </div>

              {activity.activityData && (
                <div className="activity-details">
                  {activity.activityData.fuelType && (
                    <div className="detail-item">
                      <span className="detail-label">Fuel Type:</span>
                      <span className="detail-value">{activity.activityData.fuelType}</span>
                    </div>
                  )}
                  {activity.activityData.quantity && (
                    <div className="detail-item">
                      <span className="detail-label">Quantity:</span>
                      <span className="detail-value">
                        {activity.activityData.quantity} {activity.activityData.unit}
                      </span>
                    </div>
                  )}
                  {activity.activityData.distance && (
                    <div className="detail-item">
                      <span className="detail-label">Distance:</span>
                      <span className="detail-value">
                        {activity.activityData.distance} {activity.activityData.distanceUnit || 'km'}
                      </span>
                    </div>
                  )}
                  {activity.activityData.mode && (
                    <div className="detail-item">
                      <span className="detail-label">Mode:</span>
                      <span className="detail-value">{activity.activityData.mode}</span>
                    </div>
                  )}
                  {activity.activityData.description && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Description:</span>
                      <span className="detail-value">{activity.activityData.description}</span>
                    </div>
                  )}
                </div>
              )}

              {activity.emissionFactor && (
                <div className="activity-footer">
                  <span className="factor-info">
                    📊 Emission Factor: {activity.emissionFactor.value} {activity.emissionFactor.unit}
                  </span>
                  <span className="factor-source">
                    Source: {activity.emissionFactor.source}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrgLogActivity;
