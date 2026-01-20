import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import './AutomaticTrips.css';

const AutomaticTrips = () => {
  const { user } = useContext(AuthContext);
  const [trips, setTrips] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAutomaticTrips();
  }, []);

  const fetchAutomaticTrips = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/activities/automatic-trips?limit=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTrips(response.data.trips);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching automatic trips:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="automatic-trips loading">
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
      </div>
    );
  }

  if (!trips || trips.length === 0) {
    return (
      <div className="automatic-trips empty">
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <h3>No Automatic Trips Yet</h3>
          <p>Start tracking your transport emissions using the automatic mode!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="automatic-trips">
      <div className="trips-header">
        <h3>🚗 Recent Automatic Trips</h3>
        {summary && (
          <div className="trips-summary-badges">
            <span className="summary-badge">
              {summary.totalTrips} trips
            </span>
            <span className="summary-badge">
              {summary.totalDistance} km
            </span>
            <span className="summary-badge emissions">
              {summary.totalEmissions} kg CO₂
            </span>
          </div>
        )}
      </div>

      <div className="trips-list">
        {trips.map((trip, index) => (
          <div key={trip._id || index} className="trip-card">
            <div className="trip-icon">🗺️</div>
            <div className="trip-details">
              <div className="trip-vehicle">
                {trip.transportData?.vehicleModel || 'Unknown Vehicle'}
                <span className="fuel-badge">{trip.transportData?.vehicleFuel}</span>
              </div>
              <div className="trip-distance">
                📏 {trip.transportData?.distance || 0} km
              </div>
              <div className="trip-date">
                {new Date(trip.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            <div className="trip-emission">
              <div className="emission-value">{trip.carbonEmission.toFixed(2)}</div>
              <div className="emission-unit">kg CO₂</div>
            </div>
          </div>
        ))}
      </div>

      {summary && (
        <div className="trips-summary">
          <div className="summary-stat">
            <span className="stat-label">Average Distance</span>
            <span className="stat-value">{summary.averageDistance} km</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Average Emission</span>
            <span className="stat-value">{summary.averageEmission} kg CO₂</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomaticTrips;
