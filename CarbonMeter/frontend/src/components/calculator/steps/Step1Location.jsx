import React from 'react';

const Step1Location = ({ data, updateData, updateMultiple, onNext }) => {
  const handleNext = () => {
    // Validate at least country is selected
    if (!data.country) {
      alert('Please select your country to continue');
      return;
    }
    onNext();
  };

  return (
    <div className="step-content step-location">
      <div className="step-animation">
        <div className="globe-icon">🌍</div>
      </div>
      
      <h2 className="step-title">Where are you from?</h2>
      <p className="step-description">
        Your location influences energy sources and travel patterns. This helps us provide 
        a more accurate estimate based on regional emission factors.
      </p>

      <div className="form-group">
        <label htmlFor="country">Country *</label>
        <select
          id="country"
          value={data.country}
          onChange={(e) => updateData('country', e.target.value)}
          className="select-input"
        >
          <option value="">Select your country</option>
          <option value="India">India</option>
          <option value="USA">United States</option>
          <option value="UK">United Kingdom</option>
          <option value="Canada">Canada</option>
          <option value="Australia">Australia</option>
          <option value="Germany">Germany</option>
          <option value="France">France</option>
          <option value="Japan">Japan</option>
          <option value="China">China</option>
          <option value="Brazil">Brazil</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="state">State / Province (Optional)</label>
        <input
          type="text"
          id="state"
          value={data.state}
          onChange={(e) => updateData('state', e.target.value)}
          placeholder="e.g., California, Maharashtra"
          className="text-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="city">City (Optional)</label>
        <input
          type="text"
          id="city"
          value={data.city}
          onChange={(e) => updateData('city', e.target.value)}
          placeholder="e.g., Mumbai, New York"
          className="text-input"
        />
      </div>

      <div className="button-group">
        <button className="btn-primary" onClick={handleNext}>
          Continue →
        </button>
      </div>
    </div>
  );
};

export default Step1Location;
