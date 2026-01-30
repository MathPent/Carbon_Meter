import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api.config';
import GovNavbar from '../../components/gov/GovNavbar';
import { 
  GOV_ORGANIZATION_TYPES, 
  calculateGovEmission, 
  getEmissionFormula,
  getCategoryFromActivityType 
} from '../../utils/govEmissionCalculations';
import './GovLogActivity.css';

const GovLogActivity = () => {
  const { token } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [organizationType, setOrganizationType] = useState('');
  const [activityType, setActivityType] = useState('');
  const [activityData, setActivityData] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Select Organization Type
  const handleOrgTypeSelect = (orgType) => {
    setOrganizationType(orgType);
    setStep(2);
    setActivityType('');
    setActivityData({});
  };

  // Step 2: Select Activity Type
  const handleActivityTypeSelect = (type) => {
    setActivityType(type);
    setStep(3);
    setActivityData({});
  };

  // Step 3: Enter Activity Data
  const handleDataChange = (field, value) => {
    setActivityData({
      ...activityData,
      [field]: value,
    });
  };

  // Submit Activity
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Calculate emission
      const emission = calculateGovEmission(activityType, activityData);
      const formula = getEmissionFormula(activityType, activityData);
      const category = getCategoryFromActivityType(activityType);

      const activityPayload = {
        userId: token,
        role: 'Government',
        organizationType,
        activityType,
        category,
        carbonEmission: emission,
        description: `${organizationType} - ${activityType}`,
        metadata: activityData,
        formula,
        source: 'CPCB/NITI Aayog Standards',
      };

      await axios.post(
        `${API_ENDPOINTS.GOV.BASE}/log-activity`,
        activityPayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(true);
      setTimeout(() => {
        setStep(1);
        setOrganizationType('');
        setActivityType('');
        setActivityData({});
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  const renderModuleForm = () => {
    switch (activityType) {
      case 'vehicle':
        return (
          <div className="form-group">
            <h3>Vehicle Activity</h3>
            
            <label>Vehicle Type</label>
            <select
              value={activityData.vehicleType || ''}
              onChange={(e) => handleDataChange('vehicleType', e.target.value)}
            >
              <option value="">Select Vehicle Type</option>
              <option value="sedanPetrol">Sedan (Petrol)</option>
              <option value="sedanDiesel">Sedan (Diesel)</option>
              <option value="suvPetrol">SUV (Petrol)</option>
              <option value="suvDiesel">SUV (Diesel)</option>
              <option value="bus">Bus</option>
              <option value="ambulance">Ambulance</option>
              <option value="truck">Truck</option>
              <option value="scooter">Two-Wheeler</option>
            </select>

            <label>Distance Travelled (km)</label>
            <input
              type="number"
              placeholder="Enter distance in km"
              value={activityData.distance || ''}
              onChange={(e) => handleDataChange('distance', parseFloat(e.target.value))}
            />

            <label>Fuel Type (Optional)</label>
            <select
              value={activityData.fuelType || ''}
              onChange={(e) => handleDataChange('fuelType', e.target.value)}
            >
              <option value="">Select if known</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="cng">CNG</option>
              <option value="electric">Electric</option>
            </select>

            {activityData.fuelType && (
              <>
                <label>Fuel Consumed (liters/kg)</label>
                <input
                  type="number"
                  placeholder="Enter fuel consumed"
                  value={activityData.fuelConsumed || ''}
                  onChange={(e) => handleDataChange('fuelConsumed', parseFloat(e.target.value))}
                />
              </>
            )}
          </div>
        );

      case 'electricity':
        return (
          <div className="form-group">
            <h3>Electricity Consumption</h3>
            
            <label>Energy Source</label>
            <select
              value={activityData.source || 'grid'}
              onChange={(e) => handleDataChange('source', e.target.value)}
            >
              <option value="grid">Grid Power</option>
              <option value="dgSet">DG Set (Diesel Generator)</option>
              <option value="solar">Solar Power</option>
              <option value="wind">Wind Power</option>
              <option value="renewable">Other Renewable</option>
            </select>

            <label>Consumption (kWh)</label>
            <input
              type="number"
              placeholder="Enter consumption in kWh"
              value={activityData.consumption || ''}
              onChange={(e) => handleDataChange('consumption', parseFloat(e.target.value))}
            />
          </div>
        );

      case 'dgSet':
        return (
          <div className="form-group">
            <h3>DG Set / Generator Usage</h3>
            
            <label>Fuel Consumed (liters)</label>
            <input
              type="number"
              placeholder="Enter diesel consumed in liters"
              value={activityData.fuelConsumed || ''}
              onChange={(e) => handleDataChange('fuelConsumed', parseFloat(e.target.value))}
            />

            <label>Operating Hours</label>
            <input
              type="number"
              placeholder="Hours operated"
              value={activityData.hours || ''}
              onChange={(e) => handleDataChange('hours', parseFloat(e.target.value))}
            />
          </div>
        );

      case 'waste':
        return (
          <div className="form-group">
            <h3>Waste Management</h3>
            
            <label>Waste Type</label>
            <select
              value={activityData.wasteType || 'municipal'}
              onChange={(e) => handleDataChange('wasteType', e.target.value)}
            >
              <option value="municipal">Municipal Waste</option>
              <option value="biomedical">Biomedical Waste</option>
              <option value="hazardous">Hazardous Waste</option>
              <option value="plastic">Plastic Waste</option>
              <option value="ewaste">E-Waste</option>
            </select>

            <label>Quantity (kg)</label>
            <input
              type="number"
              placeholder="Enter waste quantity in kg"
              value={activityData.quantity || ''}
              onChange={(e) => handleDataChange('quantity', parseFloat(e.target.value))}
            />
          </div>
        );

      case 'water':
        return (
          <div className="form-group">
            <h3>Water Treatment & Distribution</h3>
            
            <label>Water Volume (m³)</label>
            <input
              type="number"
              placeholder="Enter volume in cubic meters"
              value={activityData.volume || ''}
              onChange={(e) => handleDataChange('volume', parseFloat(e.target.value))}
            />
          </div>
        );

      case 'fuel':
        return (
          <div className="form-group">
            <h3>Fuel Consumption</h3>
            
            <label>Fuel Type</label>
            <select
              value={activityData.fuelType || ''}
              onChange={(e) => handleDataChange('fuelType', e.target.value)}
            >
              <option value="">Select Fuel Type</option>
              <option value="diesel">Diesel</option>
              <option value="petrol">Petrol</option>
              <option value="cng">CNG</option>
              <option value="lpg">LPG</option>
              <option value="coal">Coal</option>
            </select>

            <label>Quantity</label>
            <input
              type="number"
              placeholder="Enter quantity"
              value={activityData.quantity || ''}
              onChange={(e) => handleDataChange('quantity', parseFloat(e.target.value))}
            />

            <label>Unit</label>
            <select
              value={activityData.unit || 'liter'}
              onChange={(e) => handleDataChange('unit', e.target.value)}
            >
              <option value="liter">Liters</option>
              <option value="kg">Kilograms</option>
            </select>
          </div>
        );

      default:
        return <div className="no-data">Select an activity type to continue</div>;
    }
  };

  return (
    <>
      <GovNavbar />
      <div className="gov-log-activity">
        {/* Success Message */}
        {success && (
          <div className="success-banner">
            <span>✅</span>
            <p>Activity logged successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <span>❌</span>
            <p>{error}</p>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-circle">1</div>
            <span>Organization Type</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-circle">2</div>
            <span>Activity Type</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <span>Enter Data</span>
          </div>
        </div>

        {/* Step 1: Organization Type Selection */}
        {step === 1 && (
          <div className="step-container">
            <h2>Select Organization Type</h2>
            <div className="org-type-grid">
              {Object.entries(GOV_ORGANIZATION_TYPES).map(([key, value]) => (
                <button
                  key={key}
                  className="org-type-card"
                  onClick={() => handleOrgTypeSelect(key)}
                >
                  <span className="org-icon">{value.icon}</span>
                  <h3>{value.label}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Activity Type Selection */}
        {step === 2 && (
          <div className="step-container">
            <button className="back-btn" onClick={() => setStep(1)}>
              ← Back
            </button>
            <h2>Select Activity Type</h2>
            <p className="step-subtitle">{GOV_ORGANIZATION_TYPES[organizationType]?.label}</p>
            
            <div className="activity-type-grid">
              {GOV_ORGANIZATION_TYPES[organizationType]?.modules.map((module) => (
                <button
                  key={module}
                  className="activity-type-card"
                  onClick={() => handleActivityTypeSelect(module)}
                >
                  {module === 'vehicle' && <span className="activity-icon">🚗</span>}
                  {module === 'fuel' && <span className="activity-icon">⛽</span>}
                  {module === 'distance' && <span className="activity-icon">📏</span>}
                  {module === 'electricity' && <span className="activity-icon">⚡</span>}
                  {module === 'dgSets' && <span className="activity-icon">🔌</span>}
                  {module === 'waste' && <span className="activity-icon">🗑️</span>}
                  {module === 'water' && <span className="activity-icon">💧</span>}
                  {module === 'ambulance' && <span className="activity-icon">🚑</span>}
                  {module === 'vehicles' && <span className="activity-icon">🚗</span>}
                  {module === 'hostel' && <span className="activity-icon">🏠</span>}
                  {module === 'transport' && <span className="activity-icon">🚌</span>}
                  {module === 'production' && <span className="activity-icon">🏭</span>}
                  {module === 'hvac' && <span className="activity-icon">❄️</span>}
                  {module === 'streetLighting' && <span className="activity-icon">💡</span>}
                  <h3>{module.charAt(0).toUpperCase() + module.slice(1)}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Data Entry Form */}
        {step === 3 && (
          <div className="step-container">
            <button className="back-btn" onClick={() => setStep(2)}>
              ← Back
            </button>
            <h2>Enter Activity Details</h2>
            <p className="step-subtitle">
              {GOV_ORGANIZATION_TYPES[organizationType]?.label} - {activityType}
            </p>

            <div className="form-container">
              {renderModuleForm()}

              {/* Preview & Submit */}
              {Object.keys(activityData).length > 0 && (
                <div className="preview-section">
                  <h4>Emission Preview</h4>
                  <div className="emission-preview">
                    <span className="preview-label">Estimated Emission:</span>
                    <span className="preview-value">
                      {calculateGovEmission(activityType, activityData).toFixed(3)} kg CO₂e
                    </span>
                  </div>
                  <p className="formula-text">
                    {getEmissionFormula(activityType, activityData)}
                  </p>
                </div>
              )}

              <button
                className="submit-btn"
                onClick={handleSubmit}
                disabled={loading || Object.keys(activityData).length === 0}
              >
                {loading ? 'Logging Activity...' : '✅ Log Activity'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GovLogActivity;
