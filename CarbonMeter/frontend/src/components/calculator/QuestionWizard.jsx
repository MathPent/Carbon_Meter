import React, { useState } from 'react';
import './Calculator.css';
import Step1Location from './steps/Step1Location';
import Step2Electricity from './steps/Step2Electricity';
import Step3Housing from './steps/Step3Housing';
import Step4Food from './steps/Step4Food';
import Step5Waste from './steps/Step5Waste';
import Step6Transport from './steps/Step6Transport';
import Step7PublicTransport from './steps/Step7PublicTransport';
import Step8Government from './steps/Step8Government';
import ResultScreen from './ResultScreen';

const QuestionWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Location
    country: '',
    state: '',
    city: '',
    
    // Step 2: Electricity
    electricityUsage: 200,
    
    // Step 3: Housing
    housingType: 'apartment',
    householdSize: 1,
    energyEfficiency: 'medium',
    
    // Step 4: Food
    diet: 'mixed',
    foodLocality: 'some',
    
    // Step 5: Waste
    wasteLevel: 'average',
    
    // Step 6: Personal Transport
    personalTransportDistance: 0,
    fuelType: 'petrol',
    isSharedTransport: false,
    
    // Step 7: Public Transport & Flights
    publicTransportDistance: 0,
    flightFrequency: 'none',
    
    // Step 8: Government
    usesGovFacility: false,
    govFacilityType: '',
    govFacilityElectricity: 0,
    govUsageFrequency: 0.05
  });

  const totalSteps = 8;

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateMultipleFields = (updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Go to results
      setCurrentStep(totalSteps + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const restartCalculator = () => {
    setCurrentStep(1);
    setFormData({
      country: '',
      state: '',
      city: '',
      electricityUsage: 200,
      housingType: 'apartment',
      householdSize: 1,
      energyEfficiency: 'medium',
      diet: 'mixed',
      foodLocality: 'some',
      wasteLevel: 'average',
      personalTransportDistance: 0,
      fuelType: 'petrol',
      isSharedTransport: false,
      publicTransportDistance: 0,
      flightFrequency: 'none',
      usesGovFacility: false,
      govFacilityType: '',
      govFacilityElectricity: 0,
      govUsageFrequency: 0.05
    });
  };

  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <Step1Location
            data={formData}
            updateData={updateFormData}
            updateMultiple={updateMultipleFields}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <Step2Electricity
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 3:
        return (
          <Step3Housing
            data={formData}
            updateData={updateFormData}
            updateMultiple={updateMultipleFields}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 4:
        return (
          <Step4Food
            data={formData}
            updateData={updateFormData}
            updateMultiple={updateMultipleFields}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 5:
        return (
          <Step5Waste
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 6:
        return (
          <Step6Transport
            data={formData}
            updateData={updateFormData}
            updateMultiple={updateMultipleFields}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 7:
        return (
          <Step7PublicTransport
            data={formData}
            updateData={updateFormData}
            updateMultiple={updateMultipleFields}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 8:
        return (
          <Step8Government
            data={formData}
            updateData={updateFormData}
            updateMultiple={updateMultipleFields}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 9:
        return (
          <ResultScreen
            data={formData}
            onRestart={restartCalculator}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="question-wizard">
      {currentStep <= totalSteps && (
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <p className="progress-text">
            Step {currentStep} of {totalSteps}
          </p>
        </div>
      )}
      
      <div className="step-container">
        {renderStep()}
      </div>
    </div>
  );
};

export default QuestionWizard;
