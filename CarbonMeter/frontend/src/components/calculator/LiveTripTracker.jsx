import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { calculateDistance, calculateEmission } from '../../utils/haversine';
import api from '../../api';
import './LiveTripTracker.css';

const LiveTripTracker = ({ onBack, onComplete }) => {
  const { user } = useContext(AuthContext);

  // Vehicle state
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalEmission, setTotalEmission] = useState(0);
  const [duration, setDuration] = useState(0);
  const [gpsStatus, setGpsStatus] = useState('inactive'); // inactive, active, denied, unavailable

  // Trip data
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [saving, setSaving] = useState(false);

  // Refs for tracking
  const watchIdRef = useRef(null);
  const lastPositionRef = useRef(null);
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Fetch vehicles on mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data.data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (isTracking && !isPaused && startTimeRef.current) {
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isTracking, isPaused, startTimeRef.current]);

  // Format duration as HH:MM:SS
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start tracking
  const startTrip = async () => {
    if (!selectedVehicle) {
      alert('Please select a vehicle first');
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      alert('Geolocation is not supported by your browser');
      return;
    }

    // First, try to get permission with a single position request
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ GPS Permission Granted:', position.coords);
            resolve(position);
          },
          (error) => {
            console.error('❌ GPS Permission Error:', error);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });
    } catch (error) {
      handlePositionError(error);
      return;
    }

    // Permission granted, start tracking
    setIsTracking(true);
    setGpsStatus('active');
    startTimeRef.current = Date.now();
    setTotalDistance(0);
    setTotalEmission(0);
    setDuration(0);
    lastPositionRef.current = null;

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        handlePositionUpdate(position);
      },
      (error) => {
        handlePositionError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        distanceFilter: 10 // Only update when moved 10+ meters
      }
    );
  };

  // Handle GPS position updates
  const handlePositionUpdate = (position) => {
    console.log('📍 GPS Update:', {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy
    });

    const currentPosition = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy
    };

    // Ignore positions with poor accuracy (> 50 meters)
    if (currentPosition.accuracy > 50) {
      console.log('⚠️ Poor GPS accuracy, ignoring position');
      return;
    }

    // If this is the first position, just store it
    if (!lastPositionRef.current) {
      lastPositionRef.current = currentPosition;
      setGpsStatus('active');
      console.log('✅ Initial position set');
      return;
    }

    // Calculate distance from last position
    const distance = calculateDistance(
      lastPositionRef.current.lat,
      lastPositionRef.current.lng,
      currentPosition.lat,
      currentPosition.lng
    );

    console.log('📏 Distance calculated:', distance, 'km');

    // Ignore movements less than 20 meters (GPS noise)
    // 0.02 km = 20 meters
    if (distance < 0.02) {
      console.log('⚠️ Movement too small, ignoring (GPS noise)');
      return;
    }

    // Ignore unrealistic speeds (> 200 km/h)
    const timeDiff = (Date.now() - (lastPositionRef.current.timestamp || Date.now())) / 1000 / 3600; // hours
    if (timeDiff > 0) {
      const speed = distance / timeDiff; // km/h
      if (speed > 200) {
        console.log('⚠️ Unrealistic speed detected, ignoring:', speed, 'km/h');
        return;
      }
    }

    console.log('✅ Valid movement detected:', distance, 'km');

    // Update total distance
    setTotalDistance((prev) => {
      const newDistance = prev + distance;
      
      // Calculate emission based on new distance
      if (selectedVehicle) {
        const emission = newDistance * selectedVehicle.co2_per_km;
        setTotalEmission(emission);
      }

      return newDistance;
    });

    // Update last position with timestamp
    lastPositionRef.current = {
      ...currentPosition,
      timestamp: Date.now()
    };
  };

  // Handle GPS errors
  const handlePositionError = (error) => {
    console.error('GPS Error:', error);
    
    if (error.code === 1) {
      setGpsStatus('denied');
      alert('Location permission denied. Please enable location access to track your trip.');
      stopTrip();
    } else if (error.code === 2) {
      setGpsStatus('unavailable');
      alert('Location information unavailable. Please check your GPS settings.');
    } else if (error.code === 3) {
      // Timeout - just log it, don't stop tracking
      console.log('GPS timeout - will retry');
    }
  };

  // Stop tracking
  const stopTrip = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    setIsTracking(false);
    setGpsStatus('inactive');

    // Show confirmation if trip has meaningful data
    if (totalDistance > 0.1) {
      setShowConfirmation(true);
    } else {
      alert('Trip too short to save (minimum 100 meters)');
      resetTrip();
    }
  };

  // Reset trip data
  const resetTrip = () => {
    setTotalDistance(0);
    setTotalEmission(0);
    setDuration(0);
    setShowConfirmation(false);
    lastPositionRef.current = null;
    startTimeRef.current = null;
  };

  // Save trip to database
  const handleSaveTrip = async () => {
    setSaving(true);
    try {
      const tripData = {
        vehicleId: selectedVehicle._id,
        vehicleModel: selectedVehicle.model,
        category: selectedVehicle.category,
        fuel: selectedVehicle.fuel,
        distance: Math.round(totalDistance * 100) / 100,
        carbonEmission: Math.round(totalEmission * 1000) / 1000,
        duration: formatDuration(duration)
      };

      const response = await api.post('/live-transport/live-transport', tripData);

      if (response.data.success) {
        alert('✅ Trip saved successfully! View it in Dashboard → Log Activity');
        // Navigate to dashboard after short delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving trip:', error);
      alert('Failed to save trip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    if (isTracking) {
      const confirm = window.confirm('Are you sure you want to cancel the active trip?');
      if (confirm) {
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        resetTrip();
        onBack();
      }
    } else {
      onBack();
    }
  };

  // Render vehicle selection
  if (!selectedVehicle && !showConfirmation) {
    return (
      <div className="live-tracker-container">
        <div className="live-tracker-header">
          <div className="header-icon">🌍</div>
          <div className="header-content">
            <h2>Live Transport Tracking</h2>
            <p className="header-subtitle">Track emissions in real-time using GPS while you travel</p>
          </div>
        </div>

        <div className="info-banner">
          <span className="info-icon">ℹ️</span>
          <span>Live tracking works while the app tab is open. We use your real GPS location to measure distance accurately.</span>
        </div>

        <div className="vehicle-selection-section">
          <h3>🚗 Step 1: Select Your Vehicle</h3>
          
          {loadingVehicles ? (
            <div className="loading-vehicles">Loading vehicles...</div>
          ) : (
            <div className="vehicle-grid">
              {vehicles.slice(0, 12).map((vehicle) => (
                <div
                  key={vehicle._id}
                  className="vehicle-option-card"
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <div className="vehicle-name">{vehicle.model}</div>
                  <div className="vehicle-specs">
                    <span className="spec-badge">{vehicle.fuel}</span>
                    <span className="spec-badge">{vehicle.mileage} {vehicle.mileage_unit}</span>
                  </div>
                  <div className="vehicle-emission">
                    CO₂: {vehicle.co2_per_km} kg/km
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="cancel-button" onClick={handleCancel}>
          × Cancel
        </button>
      </div>
    );
  }

  // Render confirmation screen
  if (showConfirmation) {
    return (
      <div className="live-tracker-container">
        <div className="live-tracker-header">
          <div className="header-icon">✅</div>
          <div className="header-content">
            <h2>Trip Completed</h2>
            <p className="header-subtitle">Review your trip details before saving</p>
          </div>
        </div>

        <div className="trip-summary-card">
          <div className="summary-section">
            <h3>Trip Details</h3>
            <div className="summary-row">
              <span className="label">🚗 Vehicle:</span>
              <span className="value">{selectedVehicle.model}</span>
            </div>
            <div className="summary-row">
              <span className="label">⛽ Fuel:</span>
              <span className="value">{selectedVehicle.fuel}</span>
            </div>
            <div className="summary-row">
              <span className="label">🔧 Mileage:</span>
              <span className="value">{selectedVehicle.mileage} {selectedVehicle.mileage_unit}</span>
            </div>
            <div className="summary-row">
              <span className="label">⏱️ Duration:</span>
              <span className="value">{formatDuration(duration)}</span>
            </div>
            <div className="summary-row">
              <span className="label">📏 Distance:</span>
              <span className="value">{totalDistance.toFixed(2)} km</span>
            </div>
          </div>

          <div className="emission-summary">
            <div className="emission-label">Total Carbon Emission</div>
            <div className="emission-value-huge">
              {totalEmission.toFixed(3)} <span className="unit">kg CO₂</span>
            </div>
            <div className="emission-note">
              Calculated using: Distance × CO₂ per km
            </div>
          </div>

          <div className="confirmation-actions">
            <button
              className="back-to-track-btn"
              onClick={() => {
                setShowConfirmation(false);
                resetTrip();
              }}
            >
              ← Start New Trip
            </button>
            <button
              className="save-trip-btn"
              onClick={handleSaveTrip}
              disabled={saving}
            >
              {saving ? '💾 Saving...' : '✔ Confirm & Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render live tracking screen
  return (
    <div className="live-tracker-container">
      <div className="live-tracker-header">
        <div className="header-icon">🌍</div>
        <div className="header-content">
          <h2>Live Transport Tracking</h2>
          <p className="header-subtitle">
            {isTracking ? '🔴 Trip in Progress' : 'Ready to track your trip'}
          </p>
        </div>
      </div>

      <div className="info-banner">
        <span className="info-icon">ℹ️</span>
        <span>Live tracking works while the app tab is open. We use your real GPS location to measure distance accurately.</span>
      </div>

      <div className="selected-vehicle-banner">
        <div className="vehicle-icon">🚗</div>
        <div className="vehicle-info-compact">
          <div className="vehicle-name-compact">{selectedVehicle.model}</div>
          <div className="vehicle-specs-compact">
            {selectedVehicle.fuel} • {selectedVehicle.mileage} {selectedVehicle.mileage_unit}
          </div>
        </div>
        {!isTracking && (
          <button
            className="change-vehicle-link"
            onClick={() => setSelectedVehicle(null)}
          >
            Change
          </button>
        )}
      </div>

      <div className="live-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📏</div>
          <div className="stat-content">
            <div className="stat-label">Distance</div>
            <div className="stat-value">{totalDistance.toFixed(3)}</div>
            <div className="stat-unit">km</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-label">Duration</div>
            <div className="stat-value">{formatDuration(duration).substring(0, 5)}</div>
            <div className="stat-unit">mm:ss</div>
          </div>
        </div>

        <div className="stat-card emission-stat">
          <div className="stat-icon">💨</div>
          <div className="stat-content">
            <div className="stat-label">CO₂ Emission</div>
            <div className="stat-value">{totalEmission.toFixed(3)}</div>
            <div className="stat-unit">kg</div>
          </div>
        </div>
      </div>

      <div className="gps-status-section">
        <div className={`gps-indicator ${gpsStatus}`}>
          <span className="gps-dot"></span>
          <span className="gps-text">
            {gpsStatus === 'active' && 'GPS Active'}
            {gpsStatus === 'inactive' && 'GPS Inactive'}
            {gpsStatus === 'denied' && 'GPS Permission Denied'}
            {gpsStatus === 'unavailable' && 'GPS Unavailable'}
          </span>
        </div>
        {isTracking && (
          <div className="tracking-note">
            📍 Distance updates continuously - even small movements are tracked
          </div>
        )}
      </div>

      <div className="tracking-controls">
        {!isTracking ? (
          <button className="start-trip-btn" onClick={startTrip}>
            🎬 Start Trip
          </button>
        ) : (
          <button className="stop-trip-btn" onClick={stopTrip}>
            🛑 Stop Trip
          </button>
        )}
      </div>

      <div className="trip-note">
        💡 You can save the trip anytime, even with small distances. Location is tracked locally.
      </div>

      {!isTracking && (
        <button className="cancel-button" onClick={handleCancel}>
          × Cancel
        </button>
      )}
    </div>
  );
};

export default LiveTripTracker;
