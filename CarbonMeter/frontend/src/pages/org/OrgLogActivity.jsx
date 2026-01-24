import React, { useEffect, useState } from 'react';
import './OrgLogActivity.css';
import api from '../../api';

const OrgLogActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, monthly, quarterly, yearly

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await api.get('/activities/org-history');
      setActivities(response.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    return activity.organizationData?.timePeriod === filter;
  });

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
        <p>View all your recorded emission calculations</p>
      </div>

      <div className="log-filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All Records
        </button>
        <button 
          className={filter === 'monthly' ? 'active' : ''}
          onClick={() => setFilter('monthly')}
        >
          Monthly
        </button>
        <button 
          className={filter === 'quarterly' ? 'active' : ''}
          onClick={() => setFilter('quarterly')}
        >
          Quarterly
        </button>
        <button 
          className={filter === 'yearly' ? 'active' : ''}
          onClick={() => setFilter('yearly')}
        >
          Yearly
        </button>
      </div>

      {filteredActivities.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h3>No activities recorded yet</h3>
          <p>Start by calculating your organization's emissions</p>
        </div>
      ) : (
        <div className="activities-list">
          {filteredActivities.map((activity) => (
            <div key={activity._id} className="activity-card">
              <div className="activity-header">
                <div>
                  <h3>{activity.description}</h3>
                  <p className="activity-date">
                    {new Date(activity.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="activity-total">
                  {activity.carbonEmission.toFixed(2)}
                  <span className="unit">tCO₂e</span>
                </div>
              </div>

              {activity.organizationData && (
                <div className="activity-breakdown">
                  <div className="breakdown-item">
                    <span className="breakdown-icon">🚗</span>
                    <div>
                      <div className="breakdown-label">Scope 1</div>
                      <div className="breakdown-value">
                        {activity.organizationData.scope1.toFixed(2)} tCO₂e
                      </div>
                    </div>
                  </div>

                  <div className="breakdown-item">
                    <span className="breakdown-icon">⚡</span>
                    <div>
                      <div className="breakdown-label">Scope 2</div>
                      <div className="breakdown-value">
                        {activity.organizationData.scope2.toFixed(2)} tCO₂e
                      </div>
                    </div>
                  </div>

                  <div className="breakdown-item">
                    <span className="breakdown-icon">📦</span>
                    <div>
                      <div className="breakdown-label">Scope 3</div>
                      <div className="breakdown-value">
                        {activity.organizationData.scope3.toFixed(2)} tCO₂e
                      </div>
                    </div>
                  </div>

                  <div className="breakdown-item">
                    <span className="breakdown-icon">👥</span>
                    <div>
                      <div className="breakdown-label">Per Employee</div>
                      <div className="breakdown-value">
                        {activity.organizationData.perEmployee.toFixed(2)} tCO₂e
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="activity-period">
                <span>📅</span>
                Period: {new Date(activity.organizationData?.startDate).toLocaleDateString()} - {new Date(activity.organizationData?.endDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrgLogActivity;
