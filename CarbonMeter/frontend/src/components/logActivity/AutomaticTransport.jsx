import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import TransportMap from '../TransportMap';
import { calculateDistance, calculateEmission } from '../../utils/haversine';
import axios from 'axios';
import './AutomaticTransport.css';

const AutomaticTransport = ({ onComplete, onCancel }) => {
  const { user } = useContext(AuthContext);
  
  // Wizard steps
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Location
  const [startLocation, setStartLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Step 2: Map & Destination
  const [destination, setDestination] = useState(null);
  
  // Step 3: Vehicle
  const [categories, setCategories] = useState(['Two-wheeler', 'Four-wheeler', 'Truck', 'Bus']);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  
  // Step 4: Confirmation
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [calculatedEmission, setCalculatedEmission] = useState(null);
  const [distance, setDistance] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch vehicles when category is selected
  useEffect(() => {
    if (selectedCategory) {
      fetchVehicles(selectedCategory);
    }
  }, [selectedCategory]);

  // Calculate distance and emission when all data is available
  useEffect(() => {
    if (startLocation && destination && selectedVehicle) {
      const dist = calculateDistance(
        startLocation.lat,
        startLocation.lng,
        destination.lat,
        destination.lng
      );
      setDistance(dist);
      
      const emission = calculateEmission(dist, selectedVehicle);
      setCalculatedEmission(emission);
    }
  }, [startLocation, destination, selectedVehicle]);

  // Get user's current location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStartLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsGettingLocation(false);
        setCurrentStep(2);
      },
      (error) => {
        setIsGettingLocation(false);
        setLocationError(error.message || 'Unable to retrieve your location');
      }
    );
  };

  // Manual location input fallback
  const handleManualLocation = () => {
    const lat = prompt('Enter latitude:');
    const lng = prompt('Enter longitude:');
    
    if (lat && lng) {
      setStartLocation({
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      });
      setCurrentStep(2);
    }
  };

  // Fetch vehicles from backend
  const fetchVehicles = async (category) => {
    setIsLoadingVehicles(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/activities/vehicles?category=${category}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setVehicles(response.data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      alert('Failed to load vehicles. Please try again.');
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  // Handle vehicle selection
  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  // Show confirmation modal
  const handleCalculate = () => {
    if (!startLocation || !destination || !selectedVehicle) {
      alert('Please complete all steps before calculating');
      return;
    }
    setShowConfirmation(true);
  };

  // Save activity to backend
  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        vehicleId: selectedVehicle._id,
        vehicleModel: selectedVehicle.model,
        vehicleFuel: selectedVehicle.fuel,
        distance: parseFloat(distance),
        carbonEmission: parseFloat(calculatedEmission.co2),
        source: 'Map + Location',
        startLocation: {
          lat: startLocation.lat,
          lng: startLocation.lng
        },
        endLocation: {
          lat: destination.lat,
          lng: destination.lng
        }
      };

      console.log('Saving automatic transport:', payload);

      await axios.post('/api/activities/automatic-transport', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(`✅ Successfully saved! ${calculatedEmission.co2} kg CO₂`);
      onComplete && onComplete();
    } catch (error) {
      console.error('Error saving activity:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Failed to save activity: ${errorMsg}`);
    } finally {
      setIsSaving(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="automatic-transport">
      <div className="wizard-header">
        <h2>🚗 Automatic Transport Emission</h2>
        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>1. Location</div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>2. Map</div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>3. Vehicle</div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>4. Calculate</div>
        </div>
      </div>

      {/* Step 1: Get Location */}
      {currentStep === 1 && (
        <div className="wizard-step">
          <h3>📍 Step 1: Get Your Location</h3>
          <p>We need your current location to calculate distance</p>
          
          <button 
            className="btn-primary"
            onClick={handleGetLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? '⏳ Getting Location...' : '📍 Use My Location'}
          </button>

          <button 
            className="btn-secondary"
            onClick={handleManualLocation}
          >
            📝 Enter Manually
          </button>

          {locationError && (
            <div className="error-message">
              ⚠️ {locationError}
            </div>
          )}

          {startLocation && (
            <div className="success-message">
              ✅ Location set: {startLocation.lat.toFixed(4)}, {startLocation.lng.toFixed(4)}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Destination on Map */}
      {currentStep === 2 && (
        <div className="wizard-step">
          <h3>🗺️ Step 2: Select Destination</h3>
          <p>Click on the map to select your destination</p>
          
          <TransportMap
            startLocation={startLocation}
            destination={destination}
            onDestinationSelect={setDestination}
          />

          <div className="step-actions">
            <button className="btn-secondary" onClick={() => setCurrentStep(1)}>
              ← Back
            </button>
            <button 
              className="btn-primary"
              onClick={() => setCurrentStep(3)}
              disabled={!destination}
            >
              Next: Select Vehicle →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Vehicle */}
      {currentStep === 3 && (
        <div className="wizard-step">
          <h3>🚙 Step 3: Select Your Vehicle</h3>
          
          {/* Category Selection */}
          <div className="category-grid">
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-card ${selectedCategory === cat ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedVehicle(null);
                }}
              >
                {cat === 'Two-wheeler' && '🏍️'}
                {cat === 'Four-wheeler' && '🚗'}
                {cat === 'Truck' && '🚚'}
                {cat === 'Bus' && '🚌'}
                <span>{cat}</span>
              </button>
            ))}
          </div>

          {/* Vehicle List */}
          {selectedCategory && (
            <div className="vehicle-list">
              {isLoadingVehicles ? (
                <p>Loading vehicles...</p>
              ) : vehicles.length > 0 ? (
                vehicles.map(vehicle => (
                  <div
                    key={vehicle._id}
                    className={`vehicle-card ${selectedVehicle?._id === vehicle._id ? 'selected' : ''}`}
                    onClick={() => handleVehicleSelect(vehicle)}
                  >
                    <div className="vehicle-name">{vehicle.model}</div>
                    <div className="vehicle-details">
                      <span>{vehicle.fuel}</span>
                      <span>•</span>
                      <span>{vehicle.mileage} {vehicle.mileage_unit}</span>
                    </div>
                    <div className="vehicle-emission">
                      CO₂: {vehicle.co2_per_km} kg/km
                    </div>
                  </div>
                ))
              ) : (
                <p>No vehicles found</p>
              )}
            </div>
          )}

          <div className="step-actions">
            <button className="btn-secondary" onClick={() => setCurrentStep(2)}>
              ← Back
            </button>
            <button 
              className="btn-primary"
              onClick={() => setCurrentStep(4)}
              disabled={!selectedVehicle}
            >
              Next: Calculate →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Calculate & Confirm */}
      {currentStep === 4 && (
        <div className="wizard-step">
          <h3>📊 Step 4: Review & Calculate</h3>
          
          <div className="summary-card">
            <div className="summary-item">
              <span className="label">Distance:</span>
              <span className="value">{distance} km</span>
            </div>
            <div className="summary-item">
              <span className="label">Vehicle:</span>
              <span className="value">{selectedVehicle?.model}</span>
            </div>
            <div className="summary-item">
              <span className="label">Fuel:</span>
              <span className="value">{selectedVehicle?.fuel}</span>
            </div>
            <div className="summary-item">
              <span className="label">Emission Factor:</span>
              <span className="value">{selectedVehicle?.co2_per_km} kg/km</span>
            </div>
            {calculatedEmission && (
              <div className="summary-item highlight">
                <span className="label">Total CO₂:</span>
                <span className="value">{calculatedEmission.co2} kg</span>
              </div>
            )}
          </div>

          {calculatedEmission && (
            <div className="calculation-details">
              <p>💡 {calculatedEmission.details}</p>
            </div>
          )}

          <div className="step-actions">
            <button className="btn-secondary" onClick={() => setCurrentStep(3)}>
              ← Back
            </button>
            <button 
              className="btn-primary btn-calculate"
              onClick={handleCalculate}
            >
              ✔ Confirm & Save
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal-overlay" onClick={() => setShowConfirmation(false)}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Activity</h3>
            
            <div className="modal-map-preview">
              <TransportMap
                startLocation={startLocation}
                destination={destination}
                onDestinationSelect={() => {}}
              />
            </div>

            <div className="modal-summary">
              <p><strong>Distance:</strong> {distance} km</p>
              <p><strong>Vehicle:</strong> {selectedVehicle?.model}</p>
              <p><strong>Fuel:</strong> {selectedVehicle?.fuel}</p>
              <p><strong>Total CO₂:</strong> {calculatedEmission?.co2} kg</p>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => setShowConfirmation(false)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleConfirmSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : '✔ Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {onCancel && (
        <button className="btn-cancel" onClick={onCancel}>
          ✖ Cancel
        </button>
      )}
    </div>
  );
};

export default AutomaticTransport;
