import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OrgCalculate.css';
import api from '../../api';

const OrgCalculate = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Company Data
    timePeriod: 'monthly',
    startDate: '',
    endDate: '',
    numberOfEmployees: '',
    annualRevenue: '',
    
    // Scope 1 - Direct Emissions
    scope1: {
      // Company Vehicles
      companyVehicles: [
        { fuelType: 'Petrol', quantity: '', unit: 'litres' },
        { fuelType: 'Diesel', quantity: '', unit: 'litres' },
        { fuelType: 'CNG', quantity: '', unit: 'kg' },
      ],
      // Machinery & Equipment
      machinery: [
        { type: 'Diesel Generator', fuelUsed: '', hours: '' },
        { type: 'Natural Gas Boiler', gasUsed: '', unit: 'cubic meters' },
        { type: 'LPG Equipment', lpgUsed: '', unit: 'kg' },
      ],
      // Refrigerants & Other
      refrigerants: { type: '', quantity: '', unit: 'kg' },
    },
    
    // Scope 2 - Energy Indirect Emissions
    scope2: {
      electricity: { consumption: '', unit: 'kWh' },
      purchasedSteam: { consumption: '', unit: 'tons' },
      purchasedHeating: { consumption: '', unit: 'kWh' },
      purchasedCooling: { consumption: '', unit: 'kWh' },
    },
    
    // Scope 3 - Other Indirect Emissions
    scope3: {
      businessTravel: [
        { mode: 'Air Travel', distance: '', unit: 'km' },
        { mode: 'Rail Travel', distance: '', unit: 'km' },
        { mode: 'Hotel Stays', nights: '' },
      ],
      employeeCommuting: { employees: '', avgDistance: '', mode: 'Car' },
      transportation: {
        freightByRoad: { distance: '', weight: '' },
        freightByRail: { distance: '', weight: '' },
        freightByShip: { distance: '', weight: '' },
      },
      wasteGenerated: [
        { type: 'Landfill', quantity: '', unit: 'tons' },
        { type: 'Recycled', quantity: '', unit: 'tons' },
        { type: 'Incinerated', quantity: '', unit: 'tons' },
      ],
      purchasedGoods: { expense: '', category: 'Raw Materials' },
    },
  });

  const [calculationResult, setCalculationResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const emissionFactors = {
    petrol: 2.31, // kg CO2 per litre
    diesel: 2.68,
    cng: 1.85, // kg CO2 per kg
    dieselGenerator: 2.68, // kg CO2 per litre
    naturalGas: 2.0, // kg CO2 per cubic meter
    lpg: 2.98, // kg CO2 per kg
    electricity: 0.82, // kg CO2 per kWh (India grid average)
    steam: 340, // kg CO2 per ton
    airTravel: 0.255, // kg CO2 per passenger-km
    railTravel: 0.041,
    hotelNight: 12.5, // kg CO2 per night
    carCommute: 0.192, // kg CO2 per km
    roadFreight: 0.062, // kg CO2 per ton-km
    railFreight: 0.022,
    shipFreight: 0.016,
    landfill: 420, // kg CO2 per ton
    recycled: 50,
    incinerated: 330,
    rawMaterials: 0.5, // kg CO2 per rupee spent (industry average)
  };

  const handleInputChange = (scope, field, value, index = null, subfield = null) => {
    if (scope === 'basic') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else if (index !== null) {
      setFormData(prev => ({
        ...prev,
        [scope]: {
          ...prev[scope],
          [field]: prev[scope][field].map((item, i) => 
            i === index ? { ...item, [subfield]: value } : item
          ),
        },
      }));
    } else if (subfield) {
      setFormData(prev => ({
        ...prev,
        [scope]: {
          ...prev[scope],
          [field]: {
            ...prev[scope][field],
            [subfield]: value,
          },
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [scope]: {
          ...prev[scope],
          [field]: value,
        },
      }));
    }
  };

  const calculateEmissions = () => {
    let scope1Total = 0;
    let scope2Total = 0;
    let scope3Total = 0;

    // Scope 1 Calculations
    formData.scope1.companyVehicles.forEach(vehicle => {
      const qty = parseFloat(vehicle.quantity) || 0;
      if (vehicle.fuelType === 'Petrol') scope1Total += qty * emissionFactors.petrol;
      if (vehicle.fuelType === 'Diesel') scope1Total += qty * emissionFactors.diesel;
      if (vehicle.fuelType === 'CNG') scope1Total += qty * emissionFactors.cng;
    });

    formData.scope1.machinery.forEach(machine => {
      const fuel = parseFloat(machine.fuelUsed) || 0;
      if (machine.type === 'Diesel Generator') scope1Total += fuel * emissionFactors.dieselGenerator;
      if (machine.type === 'Natural Gas Boiler') scope1Total += fuel * emissionFactors.naturalGas;
      if (machine.type === 'LPG Equipment') scope1Total += fuel * emissionFactors.lpg;
    });

    // Scope 2 Calculations
    const electricity = parseFloat(formData.scope2.electricity.consumption) || 0;
    scope2Total += electricity * emissionFactors.electricity;

    const steam = parseFloat(formData.scope2.purchasedSteam.consumption) || 0;
    scope2Total += steam * emissionFactors.steam;

    // Scope 3 Calculations
    formData.scope3.businessTravel.forEach(travel => {
      const value = parseFloat(travel.distance || travel.nights) || 0;
      if (travel.mode === 'Air Travel') scope3Total += value * emissionFactors.airTravel;
      if (travel.mode === 'Rail Travel') scope3Total += value * emissionFactors.railTravel;
      if (travel.mode === 'Hotel Stays') scope3Total += value * emissionFactors.hotelNight;
    });

    const commuteEmployees = parseFloat(formData.scope3.employeeCommuting.employees) || 0;
    const commuteDistance = parseFloat(formData.scope3.employeeCommuting.avgDistance) || 0;
    scope3Total += commuteEmployees * commuteDistance * 22 * emissionFactors.carCommute; // 22 working days

    const roadDistance = parseFloat(formData.scope3.transportation.freightByRoad.distance) || 0;
    const roadWeight = parseFloat(formData.scope3.transportation.freightByRoad.weight) || 0;
    scope3Total += roadDistance * roadWeight * emissionFactors.roadFreight;

    formData.scope3.wasteGenerated.forEach(waste => {
      const qty = parseFloat(waste.quantity) || 0;
      if (waste.type === 'Landfill') scope3Total += qty * emissionFactors.landfill;
      if (waste.type === 'Recycled') scope3Total += qty * emissionFactors.recycled;
      if (waste.type === 'Incinerated') scope3Total += qty * emissionFactors.incinerated;
    });

    const expense = parseFloat(formData.scope3.purchasedGoods.expense) || 0;
    scope3Total += expense * emissionFactors.rawMaterials;

    // Convert to tons
    const result = {
      scope1: scope1Total / 1000,
      scope2: scope2Total / 1000,
      scope3: scope3Total / 1000,
      total: (scope1Total + scope2Total + scope3Total) / 1000,
      perEmployee: formData.numberOfEmployees ? 
        ((scope1Total + scope2Total + scope3Total) / 1000) / parseFloat(formData.numberOfEmployees) : 0,
      perRevenue: formData.annualRevenue ? 
        ((scope1Total + scope2Total + scope3Total) / 1000) / (parseFloat(formData.annualRevenue) / 1000000) : 0,
    };

    setCalculationResult(result);
    setCurrentStep(5); // Show results
  };

  const saveCalculation = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/org/save-calculation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timePeriod: formData.timePeriod,
          startDate: formData.startDate,
          endDate: formData.endDate,
          scope1: calculationResult.scope1,
          scope2: calculationResult.scope2,
          scope3: calculationResult.scope3,
          totalEmissions: calculationResult.total,
          perEmployee: calculationResult.perEmployee,
          perRevenue: calculationResult.perRevenue,
          rawData: formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save calculation');
      }

      const data = await response.json();
      alert('✅ Calculation saved successfully! Redirecting to dashboard...');
      navigate('/org/dashboard');
    } catch (error) {
      console.error('Error saving calculation:', error);
      alert(`❌ Failed to save calculation: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep1 = () => (
    <div className="form-step">
      <h2>Company Data</h2>
      <p className="step-description">Provide basic information about the reporting period</p>

      <div className="form-grid">
        <div className="form-field">
          <label>Time Period</label>
          <select 
            value={formData.timePeriod}
            onChange={(e) => handleInputChange('basic', 'timePeriod', e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="form-field">
          <label>Start Date</label>
          <input 
            type="date" 
            value={formData.startDate}
            onChange={(e) => handleInputChange('basic', 'startDate', e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>End Date</label>
          <input 
            type="date" 
            value={formData.endDate}
            onChange={(e) => handleInputChange('basic', 'endDate', e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Number of Employees</label>
          <input 
            type="number" 
            placeholder="Enter number of employees"
            value={formData.numberOfEmployees}
            onChange={(e) => handleInputChange('basic', 'numberOfEmployees', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Annual Revenue (₹)</label>
          <input 
            type="number" 
            placeholder="Enter annual revenue"
            value={formData.annualRevenue}
            onChange={(e) => handleInputChange('basic', 'annualRevenue', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-step">
      <h2>Scope 1: Direct Emissions</h2>
      <p className="step-description">Emissions from sources owned or controlled by your organization</p>

      <div className="scope-section">
        <h3>🚗 Company Vehicles</h3>
        {formData.scope1.companyVehicles.map((vehicle, index) => (
          <div key={index} className="input-row">
            <span className="input-label">{vehicle.fuelType}</span>
            <input 
              type="number" 
              placeholder={`Quantity (${vehicle.unit})`}
              value={vehicle.quantity}
              onChange={(e) => handleInputChange('scope1', 'companyVehicles', e.target.value, index, 'quantity')}
            />
            <span className="unit-label">{vehicle.unit}</span>
          </div>
        ))}
      </div>

      <div className="scope-section">
        <h3>⚙️ Machinery & Equipment</h3>
        {formData.scope1.machinery.map((machine, index) => (
          <div key={index} className="input-row">
            <span className="input-label">{machine.type}</span>
            <input 
              type="number" 
              placeholder="Fuel used"
              value={machine.fuelUsed}
              onChange={(e) => handleInputChange('scope1', 'machinery', e.target.value, index, 'fuelUsed')}
            />
            <span className="unit-label">{machine.unit}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="form-step">
      <h2>Scope 2: Energy Indirect Emissions</h2>
      <p className="step-description">Emissions from purchased electricity, steam, heating, and cooling</p>

      <div className="scope-section">
        <h3>⚡ Energy Consumption</h3>
        
        <div className="input-row">
          <span className="input-label">Electricity Purchased</span>
          <input 
            type="number" 
            placeholder="Consumption"
            value={formData.scope2.electricity.consumption}
            onChange={(e) => handleInputChange('scope2', 'electricity', e.target.value, null, 'consumption')}
          />
          <span className="unit-label">kWh</span>
        </div>

        <div className="input-row">
          <span className="input-label">Purchased Steam</span>
          <input 
            type="number" 
            placeholder="Consumption"
            value={formData.scope2.purchasedSteam.consumption}
            onChange={(e) => handleInputChange('scope2', 'purchasedSteam', e.target.value, null, 'consumption')}
          />
          <span className="unit-label">tons</span>
        </div>

        <div className="input-row">
          <span className="input-label">Purchased Heating</span>
          <input 
            type="number" 
            placeholder="Consumption"
            value={formData.scope2.purchasedHeating.consumption}
            onChange={(e) => handleInputChange('scope2', 'purchasedHeating', e.target.value, null, 'consumption')}
          />
          <span className="unit-label">kWh</span>
        </div>

        <div className="input-row">
          <span className="input-label">Purchased Cooling</span>
          <input 
            type="number" 
            placeholder="Consumption"
            value={formData.scope2.purchasedCooling.consumption}
            onChange={(e) => handleInputChange('scope2', 'purchasedCooling', e.target.value, null, 'consumption')}
          />
          <span className="unit-label">kWh</span>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="form-step">
      <h2>Scope 3: Other Indirect Emissions</h2>
      <p className="step-description">Emissions from your value chain (upstream & downstream)</p>

      <div className="scope-section">
        <h3>✈️ Business Travel</h3>
        {formData.scope3.businessTravel.map((travel, index) => (
          <div key={index} className="input-row">
            <span className="input-label">{travel.mode}</span>
            <input 
              type="number" 
              placeholder={travel.mode === 'Hotel Stays' ? 'Nights' : 'Distance (km)'}
              value={travel.distance || travel.nights || ''}
              onChange={(e) => {
                const field = travel.mode === 'Hotel Stays' ? 'nights' : 'distance';
                handleInputChange('scope3', 'businessTravel', e.target.value, index, field);
              }}
            />
            <span className="unit-label">{travel.mode === 'Hotel Stays' ? 'nights' : 'km'}</span>
          </div>
        ))}
      </div>

      <div className="scope-section">
        <h3>🚗 Employee Commuting</h3>
        <div className="input-row">
          <span className="input-label">Number of Employees</span>
          <input 
            type="number" 
            placeholder="Employees commuting"
            value={formData.scope3.employeeCommuting.employees}
            onChange={(e) => handleInputChange('scope3', 'employeeCommuting', e.target.value, null, 'employees')}
          />
        </div>
        <div className="input-row">
          <span className="input-label">Avg. Daily Distance</span>
          <input 
            type="number" 
            placeholder="One-way distance"
            value={formData.scope3.employeeCommuting.avgDistance}
            onChange={(e) => handleInputChange('scope3', 'employeeCommuting', e.target.value, null, 'avgDistance')}
          />
          <span className="unit-label">km</span>
        </div>
      </div>

      <div className="scope-section">
        <h3>🚚 Transportation & Logistics</h3>
        <div className="input-row">
          <span className="input-label">Road Freight Distance</span>
          <input 
            type="number" 
            placeholder="Distance"
            value={formData.scope3.transportation.freightByRoad.distance}
            onChange={(e) => handleInputChange('scope3', 'transportation', e.target.value, null, 'freightByRoad')}
          />
          <span className="unit-label">km</span>
        </div>
        <div className="input-row">
          <span className="input-label">Road Freight Weight</span>
          <input 
            type="number" 
            placeholder="Weight"
            value={formData.scope3.transportation.freightByRoad.weight}
            onChange={(e) => {
              setFormData(prev => ({
                ...prev,
                scope3: {
                  ...prev.scope3,
                  transportation: {
                    ...prev.scope3.transportation,
                    freightByRoad: {
                      ...prev.scope3.transportation.freightByRoad,
                      weight: e.target.value
                    }
                  }
                }
              }));
            }}
          />
          <span className="unit-label">tons</span>
        </div>
      </div>

      <div className="scope-section">
        <h3>🗑️ Waste Generated</h3>
        {formData.scope3.wasteGenerated.map((waste, index) => (
          <div key={index} className="input-row">
            <span className="input-label">{waste.type}</span>
            <input 
              type="number" 
              placeholder="Quantity"
              value={waste.quantity}
              onChange={(e) => handleInputChange('scope3', 'wasteGenerated', e.target.value, index, 'quantity')}
            />
            <span className="unit-label">tons</span>
          </div>
        ))}
      </div>

      <div className="scope-section">
        <h3>📦 Purchased Goods & Services</h3>
        <div className="input-row">
          <span className="input-label">Total Expense on Raw Materials</span>
          <input 
            type="number" 
            placeholder="Expense"
            value={formData.scope3.purchasedGoods.expense}
            onChange={(e) => handleInputChange('scope3', 'purchasedGoods', e.target.value, null, 'expense')}
          />
          <span className="unit-label">₹</span>
        </div>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="results-screen">
      <div className="results-header">
        <h2>Calculation Results</h2>
        <p>Your organization's carbon footprint for this period</p>
      </div>

      <div className="results-grid">
        <div className="result-card main-result">
          <span className="result-icon">🌍</span>
          <div className="result-label">Total Emissions</div>
          <div className="result-value">
            {calculationResult.total.toFixed(2)}
            <span className="result-unit">tCO₂e</span>
          </div>
        </div>

        <div className="result-card">
          <span className="result-icon">🚗</span>
          <div className="result-label">Scope 1 (Direct)</div>
          <div className="result-value">
            {calculationResult.scope1.toFixed(2)}
            <span className="result-unit">tCO₂e</span>
          </div>
          <div className="result-percentage">
            {((calculationResult.scope1 / calculationResult.total) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="result-card">
          <span className="result-icon">⚡</span>
          <div className="result-label">Scope 2 (Energy)</div>
          <div className="result-value">
            {calculationResult.scope2.toFixed(2)}
            <span className="result-unit">tCO₂e</span>
          </div>
          <div className="result-percentage">
            {((calculationResult.scope2 / calculationResult.total) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="result-card">
          <span className="result-icon">📦</span>
          <div className="result-label">Scope 3 (Indirect)</div>
          <div className="result-value">
            {calculationResult.scope3.toFixed(2)}
            <span className="result-unit">tCO₂e</span>
          </div>
          <div className="result-percentage">
            {((calculationResult.scope3 / calculationResult.total) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="result-card intensity">
          <span className="result-icon">👥</span>
          <div className="result-label">Per Employee</div>
          <div className="result-value">
            {calculationResult.perEmployee.toFixed(2)}
            <span className="result-unit">tCO₂e</span>
          </div>
        </div>

        <div className="result-card intensity">
          <span className="result-icon">💰</span>
          <div className="result-label">Per ₹1M Revenue</div>
          <div className="result-value">
            {calculationResult.perRevenue.toFixed(2)}
            <span className="result-unit">tCO₂e</span>
          </div>
        </div>
      </div>

      <div className="result-actions">
        <button 
          className="btn-secondary" 
          onClick={() => {
            setCalculationResult(null);
            setCurrentStep(1);
          }}
        >
          Calculate Again
        </button>
        <button 
          className="btn-primary" 
          onClick={saveCalculation}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Calculation'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="org-calculate">
      <div className="calculate-container">
        <div className="calculate-header">
          <h1>Emission Calculator</h1>
          <p>Calculate your organization's carbon footprint using the GHG Protocol</p>
        </div>

        {currentStep < 5 && (
          <div className="progress-bar">
            <div className="progress-steps">
              {[1, 2, 3, 4].map(step => (
                <div 
                  key={step}
                  className={`progress-step ${currentStep >= step ? 'active' : ''}`}
                >
                  <div className="step-circle">{step}</div>
                  <div className="step-label">
                    {step === 1 && 'Company Data'}
                    {step === 2 && 'Scope 1'}
                    {step === 3 && 'Scope 2'}
                    {step === 4 && 'Scope 3'}
                  </div>
                </div>
              ))}
            </div>
            <div className="progress-fill" style={{ width: `${(currentStep / 4) * 100}%` }} />
          </div>
        )}

        <div className="calculate-content">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderResults()}
        </div>

        {currentStep < 5 && (
          <div className="navigation-buttons">
            {currentStep > 1 && (
              <button 
                className="btn-back"
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                ← Previous
              </button>
            )}
            <button 
              className="btn-next"
              onClick={() => {
                if (currentStep === 4) {
                  calculateEmissions();
                } else {
                  setCurrentStep(prev => prev + 1);
                }
              }}
            >
              {currentStep === 4 ? 'Calculate' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgCalculate;
