import React, { useState, useEffect, useContext } from 'react';
import TransportMap from '../TransportMap';
import { calculateEmission, calculateDistance } from '../../utils/haversine';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api';
import './MapBasedTransport.css';

const MapBasedTransport = ({ onBack, onComplete }) => {
  const { user } = useContext(AuthContext);
  
  // Steps: location, map, vehicle, calculate, confirm
  const [currentStep, setCurrentStep] = useState(1);
  
  // Location state
  const [startLocation, setStartLocation] = useState(null);
  const [destination, setDestination] = useState(null);
  const [distance, setDistance] = useState(null);
  const [locationError, setLocationError] = useState(null);
  
  // Vehicle state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  
  // Calculation state
  const [emissionData, setEmissionData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Get user location
  const getUserLocation = () => {
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setStartLocation(location);
        setCurrentStep(2); // Move to map step
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        if (error.code === 1) {
          errorMessage = 'Location permission denied. Please enable location access.';
        } else if (error.code === 2) {
          errorMessage = 'Location information unavailable.';
        } else if (error.code === 3) {
          errorMessage = 'Location request timeout.';
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Manual location entry
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const handleManualLocation = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      setLocationError('Please enter valid latitude and longitude');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setLocationError('Invalid coordinates range');
      return;
    }

    setStartLocation({ lat, lng });
    setCurrentStep(2);
  };

  // Fetch vehicle categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/vehicles/categories');
        setCategories(response.data.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch vehicles by category
  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setLoadingVehicles(true);
    try {
      const response = await api.get(`/vehicles?category=${category}`);
      setVehicles(response.data.data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Calculate emission
  const handleCalculate = () => {
    if (!selectedVehicle || !distance) return;

    const result = calculateEmission(distance, selectedVehicle);
    setEmissionData(result);
    setCurrentStep(4); // Move to confirmation
  };

  // Save activity
  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      const activityData = {
        vehicleId: selectedVehicle._id,
        vehicleModel: selectedVehicle.model,
        category: selectedVehicle.category,
        fuel: selectedVehicle.fuel,
        distance: emissionData.distance,
        carbonEmission: emissionData.carbonEmission,
        startLocation,
        endLocation: destination
      };

      const response = await api.post('/automatic-transport/automatic-transport', activityData);
      
      if (response.data.success) {
        alert('✅ Activity saved successfully! View it in Dashboard → Log Activity');
        // Navigate to dashboard after short delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Failed to save activity. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Step 1: Get Location
  const renderLocationStep = () => (
    <div className="map-step-container">
      <div className="step-header">
        <div className="step-icon">📍</div>
        <h2>Step 1: Get Your Location</h2>
        <p>We need your current location to calculate distance</p>
      </div>

      <div className="location-options">
        <button className="primary-location-btn" onClick={getUserLocation}>
          <span className="btn-icon">📍</span>
          <span>USE MY LOCATION</span>
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="manual-location-form">
          <h3>🗺️ Enter Manually</h3>
          <div className="input-group">
            <input
              type="number"
              placeholder="Latitude (e.g., 28.6139)"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              step="any"
            />
            <input
              type="number"
              placeholder="Longitude (e.g., 77.2090)"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              step="any"
            />
          </div>
          <button className="secondary-btn" onClick={handleManualLocation}>
            Continue with Manual Location
          </button>
        </div>
      </div>

      {locationError && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{locationError}</span>
        </div>
      )}
    </div>
  );

  // Step 2: Select Destination on Map
  const renderMapStep = () => {
    // Handle destination selection and calculate distance
    const handleDestinationSelect = (dest) => {
      setDestination(dest);
      if (startLocation && dest) {
        const calculatedDistance = calculateDistance(
          startLocation.lat,
          startLocation.lng,
          dest.lat,
          dest.lng
        );
        setDistance(calculatedDistance);
      }
    };

    return (
      <div className="map-step-container-dark">
        <div className="step-header-compact">
          <div className="step-icon-small">🗺️</div>
          <h2>Step 2: Select Destination</h2>
        </div>
        
        <p className="map-instruction">Click on the map to select your destination</p>

        <div className="map-wrapper-compact">
          <TransportMap
            startLocation={startLocation}
            destination={destination}
            onDestinationSelect={handleDestinationSelect}
          />
        </div>

        {distance && destination && (
          <div className="distance-badge-compact">
            <div className="distance-icon">📏</div>
            <div className="distance-info">
              <div className="distance-label">DISTANCE</div>
              <div className="distance-value">{distance} km</div>
            </div>
          </div>
        )}

        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-marker green-marker">●</span>
            <span>Green marker = Start location</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker red-marker">●</span>
            <span>Red marker = Destination (click on map to set)</span>
          </div>
        </div>

        <div className="map-action-buttons">
          <button className="back-btn-map" onClick={() => setCurrentStep(1)}>
            ← Back
          </button>
          {distance && destination && (
            <button
              className="next-vehicle-btn"
              onClick={() => setCurrentStep(3)}
            >
              NEXT: SELECT VEHICLE →
            </button>
          )}
        </div>
      </div>
    );
  };

  // Step 3: Select Vehicle
  const renderVehicleStep = () => (
    <div className="map-step-container">
      <div className="step-header">
        <div className="step-icon">🚗</div>
        <h2>Step 3: Select Vehicle</h2>
        <p>Choose your vehicle category and model</p>
      </div>

      {/* Distance Info */}
      <div className="info-card">
        <span className="info-icon">📏</span>
        <span>Distance: <strong>{distance} km</strong></span>
      </div>

      {/* Category Selection */}
      {!selectedCategory && (
        <div className="category-selection">
          <h3>Select Vehicle Category</h3>
          <div className="category-grid">
            {categories.map((cat) => (
              <button
                key={cat}
                className="category-card"
                onClick={() => handleCategorySelect(cat)}
              >
                <span className="category-icon">
                  {cat === 'Two-wheeler' && '🏍️'}
                  {cat === 'Four-wheeler' && '🚗'}
                  {cat === 'Truck' && '🚚'}
                  {cat === 'Bus' && '🚌'}
                </span>
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle List */}
      {selectedCategory && (
        <div className="vehicle-selection">
          <div className="selection-header">
            <h3>{selectedCategory}s</h3>
            <button
              className="change-category-btn"
              onClick={() => {
                setSelectedCategory(null);
                setSelectedVehicle(null);
              }}
            >
              Change Category
            </button>
          </div>

          {loadingVehicles ? (
            <div className="loading">Loading vehicles...</div>
          ) : (
            <div className="vehicle-list">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle._id}
                  className={`vehicle-card ${selectedVehicle?._id === vehicle._id ? 'selected' : ''}`}
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <div className="vehicle-info">
                    <h4>{vehicle.model}</h4>
                    <div className="vehicle-details">
                      <span className="detail-badge">{vehicle.fuel}</span>
                      <span className="detail-badge">{vehicle.engine}</span>
                      <span className="detail-badge">{vehicle.mileage} {vehicle.mileage_unit}</span>
                    </div>
                  </div>
                  <div className="vehicle-emission">
                    <span className="emission-value">{vehicle.co2_per_km}</span>
                    <span className="emission-unit">kg CO₂/km</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedVehicle && (
        <button
          className="calculate-btn"
          onClick={handleCalculate}
        >
          Calculate Emission
        </button>
      )}
    </div>
  );

  // Step 4: Confirmation
  const renderConfirmationStep = () => (
    <div className="map-step-container">
      <div className="step-header">
        <div className="step-icon success-icon">✅</div>
        <h2>Emission Calculated</h2>
        <p>Review your trip details before saving</p>
      </div>

      <div className="confirmation-card">
        <div className="result-section">
          <h3>Trip Summary</h3>
          <div className="result-row">
            <span className="label">📏 Distance:</span>
            <span className="value">{emissionData.distance} km</span>
          </div>
          <div className="result-row">
            <span className="label">🚗 Vehicle:</span>
            <span className="value">{selectedVehicle.model}</span>
          </div>
          <div className="result-row">
            <span className="label">⛽ Fuel:</span>
            <span className="value">{selectedVehicle.fuel}</span>
          </div>
          <div className="result-row">
            <span className="label">🔧 Engine:</span>
            <span className="value">{selectedVehicle.engine}</span>
          </div>
          <div className="result-row">
            <span className="label">💨 Mileage:</span>
            <span className="value">{selectedVehicle.mileage} {selectedVehicle.mileage_unit}</span>
          </div>
        </div>

        <div className="emission-result">
          <div className="emission-label">Total Carbon Emission</div>
          <div className="emission-value-large">
            {emissionData.carbonEmission} <span className="unit">kg CO₂</span>
          </div>
          <div className="calculation-method">
            Method: {emissionData.calculationMethod}
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="secondary-btn"
            onClick={() => setCurrentStep(3)}
          >
            ← Back to Vehicle
          </button>
          <button
            className="confirm-save-btn"
            onClick={handleConfirmSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : '✔ Confirm & Save'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="map-based-transport">
      {/* Progress Indicator */}
      <div className="progress-steps">
        <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Location</div>
        </div>
        <div className={`progress-line ${currentStep > 1 ? 'completed' : ''}`} />
        <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Map</div>
        </div>
        <div className={`progress-line ${currentStep > 2 ? 'completed' : ''}`} />
        <div className={`progress-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Vehicle</div>
        </div>
        <div className={`progress-line ${currentStep > 3 ? 'completed' : ''}`} />
        <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">Calculate</div>
        </div>
      </div>

      {/* Step Content */}
      <div className="step-content">
        {currentStep === 1 && renderLocationStep()}
        {currentStep === 2 && renderMapStep()}
        {currentStep === 3 && renderVehicleStep()}
        {currentStep === 4 && renderConfirmationStep()}
      </div>

      {/* Cancel Button */}
      {currentStep < 4 && (
        <button className="cancel-btn" onClick={onBack}>
          × Cancel
        </button>
      )}
    </div>
  );
};

export default MapBasedTransport;
