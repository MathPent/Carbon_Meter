import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ModuleStyles.css';

const TransportModule = ({ onCalculate, onBack }) => {
  const [transportType, setTransportType] = useState('road'); // road, air, rail
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [fuelType, setFuelType] = useState('petrol');
  const [distance, setDistance] = useState('');
  const [mileage, setMileage] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Emission Factors (Government approved)
  const emissionFactors = {
    petrol: 2.31, // kg CO2 per litre
    diesel: 2.68,
    cng: 2.75, // kg CO2 per kg
    lpg: 3.13,
    electric: 0.82, // kg CO2 per kWh (grid average)
    air_domestic: 0.15, // kg CO2 per km per passenger
    rail_diesel: 2.68, // kg CO2 per litre
    rail_electric: 0.82 // kg CO2 per kWh
  };

  useEffect(() => {
    // Fetch vehicle database (optional - for auto-mileage)
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/vehicles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVehicles(response.data.data || []);
    } catch (error) {
      console.log('Vehicle database not available, manual entry required');
    }
  };

  const calculateEmission = () => {
    setLoading(true);
    let emission = 0;
    let breakdown = {};
    let formula = '';

    const dist = parseFloat(distance);
    const mil = parseFloat(mileage);

    if (transportType === 'road') {
      // Formula: Fuel_Consumed = Distance ÷ Mileage
      // CO2 = Fuel_Consumed × Emission_Factor
      if (!dist || !mil) {
        alert('Please enter distance and mileage');
        setLoading(false);
        return;
      }

      const fuelConsumed = dist / mil;
      const ef = emissionFactors[fuelType];
      emission = fuelConsumed * ef;

      formula = `Fuel Consumed = ${dist} km ÷ ${mil} km/l = ${fuelConsumed.toFixed(2)} litres\n`;
      formula += `CO₂ Emission = ${fuelConsumed.toFixed(2)} litres × ${ef} kg/l = ${emission.toFixed(2)} kg CO₂`;

      breakdown = {
        distance: dist,
        mileage: mil,
        fuelConsumed: fuelConsumed.toFixed(2),
        emissionFactor: ef,
        fuelType: fuelType.toUpperCase()
      };

    } else if (transportType === 'air') {
      // Formula: CO2 = Distance × 0.15 (domestic economy)
      if (!dist) {
        alert('Please enter distance');
        setLoading(false);
        return;
      }

      const ef = emissionFactors.air_domestic;
      emission = dist * ef;

      formula = `CO₂ Emission = ${dist} km × ${ef} kg/km = ${emission.toFixed(2)} kg CO₂`;

      breakdown = {
        distance: dist,
        emissionFactor: ef,
        flightType: 'Domestic Economy'
      };

    } else if (transportType === 'rail') {
      // Formula depends on diesel or electric
      if (!dist) {
        alert('Please enter distance');
        setLoading(false);
        return;
      }

      if (fuelType === 'diesel') {
        // Assuming average diesel consumption per km
        const avgConsumption = 0.05; // litres per km (estimate)
        const fuelConsumed = dist * avgConsumption;
        const ef = emissionFactors.rail_diesel;
        emission = fuelConsumed * ef;

        formula = `Fuel Consumed (estimate) = ${dist} km × ${avgConsumption} l/km = ${fuelConsumed.toFixed(2)} litres\n`;
        formula += `CO₂ Emission = ${fuelConsumed.toFixed(2)} litres × ${ef} kg/l = ${emission.toFixed(2)} kg CO₂`;

        breakdown = {
          distance: dist,
          fuelConsumed: fuelConsumed.toFixed(2),
          emissionFactor: ef,
          trainType: 'Diesel Train'
        };
      } else {
        // Electric train
        const avgConsumption = 0.1; // kWh per km (estimate)
        const energyConsumed = dist * avgConsumption;
        const ef = emissionFactors.rail_electric;
        emission = energyConsumed * ef;

        formula = `Energy Consumed (estimate) = ${dist} km × ${avgConsumption} kWh/km = ${energyConsumed.toFixed(2)} kWh\n`;
        formula += `CO₂ Emission = ${energyConsumed.toFixed(2)} kWh × ${ef} kg/kWh = ${emission.toFixed(2)} kg CO₂`;

        breakdown = {
          distance: dist,
          energyConsumed: energyConsumed.toFixed(2),
          emissionFactor: ef,
          trainType: 'Electric Train'
        };
      }
    }

    const data = {
      category: 'transport',
      transportType,
      vehicleType: vehicleType || 'Not specified',
      vehicleName: vehicleName || 'Not specified',
      fuelType,
      distance: dist,
      mileage: mil || 'N/A',
      emission: emission.toFixed(2),
      breakdown,
      formula,
      source: 'IPCC, MoEFCC India'
    };

    setTimeout(() => {
      setLoading(false);
      onCalculate(data, emission);
    }, 500);
  };

  return (
    <div className="transport-module">
      <h2 className="module-title">🚗 Transport Emissions</h2>
      <p className="module-subtitle">Calculate emissions from your travel</p>

      {/* Transport Type Selection */}
      <div className="form-section">
        <label className="form-label">Transport Type *</label>
        <div className="transport-type-tabs">
          <button
            className={`transport-tab ${transportType === 'road' ? 'active' : ''}`}
            onClick={() => setTransportType('road')}
          >
            🚗 Road
          </button>
          <button
            className={`transport-tab ${transportType === 'air' ? 'active' : ''}`}
            onClick={() => setTransportType('air')}
          >
            ✈️ Air
          </button>
          <button
            className={`transport-tab ${transportType === 'rail' ? 'active' : ''}`}
            onClick={() => setTransportType('rail')}
          >
            🚆 Rail
          </button>
        </div>
      </div>

      {/* Road Transport Form */}
      {transportType === 'road' && (
        <>
          <div className="form-section">
            <label className="form-label">Vehicle Type (Optional)</label>
            <select
              className="form-input"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            >
              <option value="">Select vehicle type</option>
              <option value="car">Car</option>
              <option value="bike">Bike/Scooter</option>
              <option value="bus">Bus</option>
              <option value="truck">Truck</option>
              <option value="auto">Auto Rickshaw</option>
            </select>
          </div>

          <div className="form-section">
            <label className="form-label">Vehicle Name (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Honda City, Royal Enfield"
              value={vehicleName}
              onChange={(e) => setVehicleName(e.target.value)}
            />
          </div>

          <div className="form-section">
            <label className="form-label">Fuel Type *</label>
            <select
              className="form-input"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
            >
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="cng">CNG</option>
              <option value="lpg">LPG</option>
              <option value="electric">Electric</option>
            </select>
          </div>

          <div className="form-grid">
            <div className="form-section">
              <label className="form-label">Distance Travelled (km) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            <div className="form-section">
              <label className="form-label">Mileage (km/l or km/kg) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter mileage"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="info-box">
            <span className="info-icon">ℹ️</span>
            <div>
              <strong>Formula:</strong> Fuel Consumed = Distance ÷ Mileage | CO₂ = Fuel × Emission Factor
              <br />
              <strong>Emission Factors:</strong> Petrol (2.31), Diesel (2.68), CNG (2.75), LPG (3.13) kg CO₂ per unit
              <br />
              <strong>Source:</strong> MoEFCC India, IPCC
            </div>
          </div>
        </>
      )}

      {/* Air Transport Form */}
      {transportType === 'air' && (
        <>
          <div className="form-section">
            <label className="form-label">Flight Distance (km) *</label>
            <input
              type="number"
              className="form-input"
              placeholder="Enter distance"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              min="0"
              step="1"
            />
          </div>

          <div className="info-box">
            <span className="info-icon">ℹ️</span>
            <div>
              <strong>Formula:</strong> CO₂ = Distance × 0.15 kg/km (Domestic Economy)
              <br />
              <strong>Source:</strong> IPCC, DGCA
            </div>
          </div>
        </>
      )}

      {/* Rail Transport Form */}
      {transportType === 'rail' && (
        <>
          <div className="form-section">
            <label className="form-label">Train Type *</label>
            <select
              className="form-input"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
            >
              <option value="diesel">Diesel Train</option>
              <option value="electric">Electric Train</option>
            </select>
          </div>

          <div className="form-section">
            <label className="form-label">Distance Travelled (km) *</label>
            <input
              type="number"
              className="form-input"
              placeholder="Enter distance"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              min="0"
              step="1"
            />
          </div>

          <div className="info-box">
            <span className="info-icon">ℹ️</span>
            <div>
              <strong>Formula:</strong> CO₂ = Energy/Fuel Consumed × Emission Factor
              <br />
              <strong>Diesel:</strong> 2.68 kg CO₂/l | <strong>Electric:</strong> 0.82 kg CO₂/kWh
              <br />
              <strong>Source:</strong> Indian Railways, IPCC
            </div>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="module-actions">
        <button className="btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <button
          className="btn-primary"
          onClick={calculateEmission}
          disabled={loading}
        >
          {loading ? 'Calculating...' : 'Calculate Emission →'}
        </button>
      </div>
    </div>
  );
};

export default TransportModule;
