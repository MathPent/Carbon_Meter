import React, { useState } from 'react';
import '../modules/ModuleStyles.css';

const FoodModule = ({ onCalculate, onBack }) => {
  const [foodType, setFoodType] = useState('animal'); // animal or plant
  const [loading, setLoading] = useState(false);

  // Animal-based food emission factors (kg CO2 per kg food)
  const animalFood = {
    beef: { name: 'Beef', ef: 27 },
    lamb: { name: 'Lamb/Mutton', ef: 39 },
    pork: { name: 'Pork', ef: 12 },
    chicken: { name: 'Chicken', ef: 6 },
    milk: { name: 'Milk', ef: 3 },
    cheese: { name: 'Cheese', ef: 13 }
  };

  // Plant-based food emission factors (kg CO2 per kg food)
  const plantFood = {
    rice: { name: 'Rice', ef: 4 },
    wheat: { name: 'Wheat', ef: 1.4 },
    pulses: { name: 'Pulses/Lentils', ef: 0.9 },
    vegetables: { name: 'Vegetables', ef: 0.5 },
    fruits: { name: 'Fruits', ef: 0.7 }
  };

  const [quantities, setQuantities] = useState({});

  const handleQuantityChange = (item, value) => {
    setQuantities(prev => ({
      ...prev,
      [item]: value
    }));
  };

  const calculateEmission = () => {
    setLoading(true);

    const foodItems = foodType === 'animal' ? animalFood : plantFood;
    let totalEmission = 0;
    const breakdown = [];

    Object.keys(quantities).forEach(item => {
      const qty = parseFloat(quantities[item]);
      if (qty > 0 && foodItems[item]) {
        const emission = qty * foodItems[item].ef;
        totalEmission += emission;
        breakdown.push({
          item: foodItems[item].name,
          quantity: qty,
          ef: foodItems[item].ef,
          emission: emission.toFixed(2)
        });
      }
    });

    if (breakdown.length === 0) {
      alert('Please enter at least one food item quantity');
      setLoading(false);
      return;
    }

    let formula = 'Formula: CO₂ = Quantity (kg) × Emission Factor\n\n';
    breakdown.forEach(item => {
      formula += `${item.item}: ${item.quantity} kg × ${item.ef} = ${item.emission} kg CO₂\n`;
    });
    formula += `\nTotal: ${totalEmission.toFixed(2)} kg CO₂`;

    const data = {
      category: 'food',
      foodType,
      items: breakdown,
      totalEmission: totalEmission.toFixed(2),
      emission: totalEmission.toFixed(2),
      formula,
      source: 'IPCC Lifecycle Data'
    };

    setTimeout(() => {
      setLoading(false);
      onCalculate(data, totalEmission);
    }, 500);
  };

  const currentFoodItems = foodType === 'animal' ? animalFood : plantFood;

  return (
    <div className="food-module">
      <h2 className="module-title">🍽️ Food Emissions</h2>
      <p className="module-subtitle">Calculate emissions from food consumption</p>

      <div className="food-type-selector">
        <button
          className={`food-type-tab ${foodType === 'animal' ? 'active' : ''}`}
          onClick={() => setFoodType('animal')}
        >
          🥩 Animal-Based
        </button>
        <button
          className={`food-type-tab ${foodType === 'plant' ? 'active' : ''}`}
          onClick={() => setFoodType('plant')}
        >
          🌱 Plant-Based
        </button>
      </div>

      <div className="food-items-grid">
        {Object.keys(currentFoodItems).map(key => (
          <div key={key} className="food-item-card">
            <label>
              {currentFoodItems[key].name}
              <span className="food-ef-note"> ({currentFoodItems[key].ef} kg CO₂/kg)</span>
            </label>
            <input
              type="number"
              placeholder="Quantity (kg)"
              value={quantities[key] || ''}
              onChange={(e) => handleQuantityChange(key, e.target.value)}
              min="0"
              step="0.1"
            />
          </div>
        ))}
      </div>

      <div className="info-box">
        <span className="info-icon">ℹ️</span>
        <div>
          <strong>Formula:</strong> CO₂ = Quantity (kg) × Emission Factor
          <br />
          <strong>Source:</strong> IPCC Lifecycle Assessment Data
          <br />
          <em>Enter quantities for items you consumed (weekly or monthly basis)</em>
        </div>
      </div>

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

export default FoodModule;
