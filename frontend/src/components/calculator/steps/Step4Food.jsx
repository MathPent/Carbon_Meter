import React from 'react';

const Step4Food = ({ data, updateData, updateMultiple, onNext, onPrev }) => {
  const dietOptions = [
    { value: 'vegan', label: 'Vegan', icon: '🥗', description: 'Plant-based only' },
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥛', description: 'No meat, includes dairy' },
    { value: 'mixed', label: 'Mixed', icon: '🍽️', description: 'Balanced diet' },
    { value: 'meatHeavy', label: 'Meat-Heavy', icon: '🥩', description: 'Daily meat consumption' }
  ];

  const localityOptions = [
    { value: 'all', label: 'All', description: 'Mostly local & unprocessed' },
    { value: 'most', label: 'Most', description: 'Often local produce' },
    { value: 'some', label: 'Some', description: 'Mix of local & imported' },
    { value: 'none', label: 'None', description: 'Mostly processed/imported' }
  ];

  return (
    <div className="step-content step-food">
      <div className="step-animation">
        <div className="food-icon">🌱</div>
      </div>
      
      <h2 className="step-title">What do you eat?</h2>
      <p className="step-description">
        Food production has a huge climate impact. Animal-based foods typically 
        have higher emissions than plant-based alternatives.
      </p>

      <div className="form-group">
        <label>How often do you eat animal-based food?</label>
        <div className="option-grid">
          {dietOptions.map(option => (
            <button
              key={option.value}
              className={`option-card ${data.diet === option.value ? 'selected' : ''}`}
              onClick={() => updateData('diet', option.value)}
            >
              <span className="option-icon">{option.icon}</span>
              <span className="option-label">{option.label}</span>
              <span className="option-description">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>How much of your food is local or unprocessed?</label>
        <div className="radio-group">
          {localityOptions.map(option => (
            <label
              key={option.value}
              className={`radio-option ${data.foodLocality === option.value ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="locality"
                value={option.value}
                checked={data.foodLocality === option.value}
                onChange={(e) => updateData('foodLocality', e.target.value)}
              />
              <div className="radio-content">
                <strong>{option.label}</strong>
                <p>{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="info-box">
        <p>
          💡 <strong>Did you know?</strong> Eating local, seasonal produce can reduce your 
          food-related emissions by up to 20%!
        </p>
      </div>

      <div className="button-group">
        <button className="btn-secondary" onClick={onPrev}>
          ← Back
        </button>
        <button className="btn-primary" onClick={onNext}>
          Continue →
        </button>
      </div>
    </div>
  );
};

export default Step4Food;
