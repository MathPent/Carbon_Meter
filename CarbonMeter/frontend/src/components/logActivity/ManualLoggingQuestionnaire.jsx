import React, { useState } from 'react';
import './ManualLoggingQuestionnaire.css';
import api from '../../api';

const ManualLoggingQuestionnaire = ({ onComplete, onCancel }) => {
  // Question database organized by category and subcategory
  const questionData = {
    transport: {
      name: 'Transport',
      icon: '🚗',
      subcategories: {
        road: {
          name: 'Road Travel',
          questions: [
            {
              id: 't1',
              question: 'Do you own a personal vehicle?',
              type: 'radio',
              options: ['Yes', 'No', "I don't know"],
              field: 'ownsVehicle'
            },
            {
              id: 't2',
              question: 'What type of vehicle do you use most often?',
              type: 'select',
              options: ['Car - Petrol', 'Car - Diesel', 'Car - Electric', 'Motorcycle', 'Scooter'],
              field: 'vehicleType',
              showIf: { field: 'ownsVehicle', value: 'Yes' }
            },
            {
              id: 't3',
              question: 'What is your average monthly distance traveled?',
              type: 'number',
              unit: 'km',
              field: 'monthlyDistance',
              showIf: { field: 'ownsVehicle', value: 'Yes' }
            }
          ]
        },
        rail: {
          name: 'Rail Travel',
          questions: [
            {
              id: 't4',
              question: 'How often do you travel by train?',
              type: 'radio',
              options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'],
              field: 'trainFrequency'
            },
            {
              id: 't5',
              question: 'Average distance per train journey?',
              type: 'number',
              unit: 'km',
              field: 'trainDistance',
              showIf: { field: 'trainFrequency', notValue: 'Never' }
            }
          ]
        },
        air: {
          name: 'Air Travel',
          questions: [
            {
              id: 't6',
              question: 'How many flights do you take per year?',
              type: 'number',
              unit: 'flights',
              field: 'flightsPerYear'
            },
            {
              id: 't7',
              question: 'Average flight distance?',
              type: 'select',
              options: ['Short (< 500 km)', 'Medium (500-1500 km)', 'Long (> 1500 km)'],
              field: 'flightDistance',
              showIf: { field: 'flightsPerYear', operator: '>', value: 0 }
            }
          ]
        }
      }
    },
    electricity: {
      name: 'Electricity',
      icon: '⚡',
      subcategories: {
        grid: {
          name: 'Grid Electricity',
          questions: [
            {
              id: 'e1',
              question: 'What is your monthly electricity consumption?',
              type: 'number',
              unit: 'kWh',
              field: 'monthlyKwh',
              helper: 'Check your electricity bill'
            },
            {
              id: 'e2',
              question: 'How many people live in your household?',
              type: 'number',
              unit: 'people',
              field: 'householdSize'
            }
          ]
        },
        dg: {
          name: 'Diesel Generator',
          questions: [
            {
              id: 'e3',
              question: 'Do you use a diesel generator?',
              type: 'radio',
              options: ['Yes', 'No'],
              field: 'usesDG'
            },
            {
              id: 'e4',
              question: 'Average monthly hours of generator usage?',
              type: 'number',
              unit: 'hours',
              field: 'dgHours',
              showIf: { field: 'usesDG', value: 'Yes' }
            }
          ]
        },
        solar: {
          name: 'Solar Power',
          questions: [
            {
              id: 'e5',
              question: 'Do you have solar panels installed?',
              type: 'radio',
              options: ['Yes', 'No'],
              field: 'hasSolar'
            }
          ]
        }
      }
    },
    food: {
      name: 'Food',
      icon: '🍽️',
      subcategories: {
        diet: {
          name: 'Diet Type',
          questions: [
            {
              id: 'f1',
              question: 'What best describes your diet?',
              type: 'radio',
              options: ['Vegan', 'Vegetarian', 'Mixed (some meat)', 'Meat-heavy'],
              field: 'dietType'
            },
            {
              id: 'f2',
              question: 'How many meals do you eat per day?',
              type: 'number',
              unit: 'meals',
              field: 'mealsPerDay'
            }
          ]
        },
        source: {
          name: 'Food Source',
          questions: [
            {
              id: 'f3',
              question: 'How much of your food is locally sourced?',
              type: 'radio',
              options: ['None', 'Some (25%)', 'Most (50%)', 'All (100%)'],
              field: 'localFood'
            }
          ]
        },
        waste: {
          name: 'Food Waste',
          questions: [
            {
              id: 'f4',
              question: 'How much food do you waste per week?',
              type: 'number',
              unit: 'kg',
              field: 'foodWaste'
            }
          ]
        }
      }
    },
    waste: {
      name: 'Waste',
      icon: '♻️',
      subcategories: {
        solid: {
          name: 'Solid Waste',
          questions: [
            {
              id: 'w1',
              question: 'How much waste does your household generate daily?',
              type: 'radio',
              options: ['Low (< 1 kg/day)', 'Average (1-2 kg/day)', 'High (> 2 kg/day)'],
              field: 'wasteLevel'
            }
          ]
        },
        recycling: {
          name: 'Recycling',
          questions: [
            {
              id: 'w2',
              question: 'Do you separate recyclable waste?',
              type: 'radio',
              options: ['Yes, always', 'Sometimes', 'No'],
              field: 'recycling'
            },
            {
              id: 'w3',
              question: 'Do you compost organic waste?',
              type: 'radio',
              options: ['Yes', 'No'],
              field: 'composting'
            }
          ]
        }
      }
    }
  };

  const [currentCategoryId, setCurrentCategoryId] = useState('transport');
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [emissions, setEmissions] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Get all questions in order
  const getAllQuestions = () => {
    const allQuestions = [];
    Object.keys(questionData).forEach(catId => {
      const category = questionData[catId];
      Object.keys(category.subcategories).forEach(subId => {
        category.subcategories[subId].questions.forEach(q => {
          allQuestions.push({
            ...q,
            categoryId: catId,
            categoryName: category.name,
            subcategoryName: category.subcategories[subId].name
          });
        });
      });
    });
    return allQuestions.filter(q => shouldShowQuestion(q));
  };

  const shouldShowQuestion = (question) => {
    if (!question.showIf) return true;
    
    const { field, value, notValue, operator } = question.showIf;
    const answer = answers[field];

    if (notValue !== undefined) {
      return answer !== notValue;
    }
    if (operator === '>') {
      return parseFloat(answer) > value;
    }
    return answer === value;
  };

  const allQuestions = getAllQuestions();
  const currentQuestion = allQuestions[currentQuestionIndex];
  const totalQuestions = allQuestions.length;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const categories = Object.keys(questionData).map(id => ({
    id,
    ...questionData[id]
  }));

  const handleAnswer = (value) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.field]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      
      // Update current category based on next question
      const nextQuestion = allQuestions[currentQuestionIndex + 1];
      if (nextQuestion && nextQuestion.categoryId !== currentCategoryId) {
        setCurrentCategoryId(nextQuestion.categoryId);
      }
    } else {
      // All questions completed
      calculateEmissions();
      setShowResults(true);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const calculateEmissions = () => {
    const calculated = {
      transport: 0,
      electricity: 0,
      food: 0,
      waste: 0,
      total: 0
    };

    // Transport calculations
    if (answers.ownsVehicle === 'Yes') {
      const distance = parseFloat(answers.monthlyDistance) || 0;
      let emissionFactor = 0.171; // default car petrol
      
      if (answers.vehicleType?.includes('Diesel')) emissionFactor = 0.168;
      else if (answers.vehicleType?.includes('Electric')) emissionFactor = 0.082;
      else if (answers.vehicleType === 'Motorcycle') emissionFactor = 0.089;
      else if (answers.vehicleType === 'Scooter') emissionFactor = 0.067;
      
      calculated.transport += distance * emissionFactor;
    }

    // Train emissions
    if (answers.trainFrequency && answers.trainFrequency !== 'Never') {
      const trainDist = parseFloat(answers.trainDistance) || 0;
      let frequency = 1;
      if (answers.trainFrequency === 'Daily') frequency = 30;
      else if (answers.trainFrequency === 'Weekly') frequency = 4;
      else if (answers.trainFrequency === 'Monthly') frequency = 1;
      
      calculated.transport += trainDist * frequency * 0.041; // rail emission factor
    }

    // Flight emissions
    const flights = parseFloat(answers.flightsPerYear) || 0;
    if (flights > 0) {
      let avgDistance = 1000;
      if (answers.flightDistance === 'Short (< 500 km)') avgDistance = 300;
      else if (answers.flightDistance === 'Medium (500-1500 km)') avgDistance = 1000;
      else if (answers.flightDistance === 'Long (> 1500 km)') avgDistance = 3000;
      
      calculated.transport += (flights * avgDistance * 0.115) / 12; // per month
    }

    // Electricity calculations
    const kwh = parseFloat(answers.monthlyKwh) || 0;
    const household = parseFloat(answers.householdSize) || 1;
    calculated.electricity = (kwh / household) * 0.82; // grid emission factor

    if (answers.usesDG === 'Yes') {
      const dgHours = parseFloat(answers.dgHours) || 0;
      calculated.electricity += dgHours * 2.68; // DG emission factor
    }

    // Food calculations
    const dietEmissions = {
      'Vegan': 2.5,
      'Vegetarian': 3.8,
      'Mixed (some meat)': 5.6,
      'Meat-heavy': 7.2
    };
    calculated.food = (dietEmissions[answers.dietType] || 5.0) * 30; // per month

    const foodWaste = parseFloat(answers.foodWaste) || 0;
    calculated.food += foodWaste * 4 * 2.5; // weekly waste * 4 weeks * emission factor

    // Waste calculations
    const wasteEmissions = {
      'Low (< 1 kg/day)': 20,
      'Average (1-2 kg/day)': 50,
      'High (> 2 kg/day)': 100
    };
    calculated.waste = wasteEmissions[answers.wasteLevel] || 50;

    if (answers.composting === 'Yes') {
      calculated.waste *= 0.7; // 30% reduction
    }

    calculated.total = calculated.transport + calculated.electricity + calculated.food + calculated.waste;
    
    setEmissions(calculated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('Please login first');
        if (onComplete) onComplete();
        return;
      }
      
      await api.post(
        '/activities/log-manual',
        {
          category: 'Comprehensive',
          logType: 'manual',
          description: 'Monthly carbon footprint questionnaire',
          carbonEmission: emissions.total,
          data: {
            breakdown: emissions,
            answers: answers,
            questionnaireType: 'monthly_comprehensive'
          },
          formula: 'Multi-category emission calculation based on CPCB/IPCC standards',
          source: 'Manual Questionnaire'
        }
      );

      alert('✅ Activity saved successfully! View it in Dashboard → Log Activity');
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Failed to save activity. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (showResults) {
    return (
      <div className="manual-logging-results">
        <div className="results-header">
          <h1>🌍 Your Carbon Footprint</h1>
          <p>Based on your monthly activity</p>
        </div>

        <div className="results-total-card">
          <div className="total-value">{emissions.total.toFixed(2)}</div>
          <div className="total-unit">kg CO₂e / month</div>
        </div>

        <div className="results-breakdown">
          <h2>Category Breakdown</h2>
          <div className="breakdown-cards">
            {[
              { id: 'transport', name: 'Transport', icon: '🚗', value: emissions.transport },
              { id: 'electricity', name: 'Electricity', icon: '⚡', value: emissions.electricity },
              { id: 'food', name: 'Food', icon: '🍽️', value: emissions.food },
              { id: 'waste', name: 'Waste', icon: '♻️', value: emissions.waste }
            ].map(cat => (
              <div key={cat.id} className="breakdown-card">
                <div className="breakdown-icon">{cat.icon}</div>
                <div className="breakdown-name">{cat.name}</div>
                <div className="breakdown-value">{cat.value.toFixed(2)} kg</div>
                <div className="breakdown-percent">
                  {((cat.value / emissions.total) * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="results-actions">
          <button className="btn-save" onClick={handleSave} disabled={isSaving}>
            {isSaving ? '💾 Saving...' : '💾 Save to Dashboard'}
          </button>
          <button className="btn-recalculate" onClick={() => setShowResults(false)}>
            🔁 Edit Answers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="manual-logging-questionnaire">
      {/* Top Progress Bar */}
      <div className="questionnaire-header">
        <div className="progress-info">
          <span className="progress-text">Question {currentQuestionIndex + 1} / {totalQuestions}</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Horizontal Categories */}
      <div className="categories-horizontal">
        {categories.map(cat => (
          <div 
            key={cat.id}
            className={`category-tab ${currentCategoryId === cat.id ? 'active' : ''}`}
          >
            <span className="category-icon">{cat.icon}</span>
            <span className="category-name">{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Question Card */}
      <div className="question-container">
        {currentQuestion && (
          <div className="question-card">
            <div className="question-header">
              <div className="question-category-badge">
                {currentQuestion.categoryName} → {currentQuestion.subcategoryName}
              </div>
              <h2 className="question-title">{currentQuestion.question}</h2>
              {currentQuestion.helper && (
                <p className="question-helper">{currentQuestion.helper}</p>
              )}
            </div>

            <div className="question-input-area">
              {currentQuestion.type === 'radio' && (
                <div className="radio-options">
                  {currentQuestion.options.map(option => (
                    <label key={option} className="radio-option">
                      <input
                        type="radio"
                        name={currentQuestion.field}
                        value={option}
                        checked={answers[currentQuestion.field] === option}
                        onChange={(e) => handleAnswer(e.target.value)}
                      />
                      <span className="radio-label">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'select' && (
                <select
                  id={currentQuestion.field}
                  name={currentQuestion.field}
                  className="select-input"
                  value={answers[currentQuestion.field] || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                >
                  <option value="">-- Select an option --</option>
                  {currentQuestion.options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              )}

              {currentQuestion.type === 'number' && (
                <div className="number-input-group">
                  <input
                    type="number"
                    id={currentQuestion.field}
                    name={currentQuestion.field}
                    className="number-input"
                    value={answers[currentQuestion.field] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    placeholder="Enter value"
                    min="0"
                  />
                  {currentQuestion.unit && (
                    <span className="input-unit">{currentQuestion.unit}</span>
                  )}
                </div>
              )}
            </div>

            <div className="question-actions">
              <button className="btn-skip" onClick={handleSkip}>
                Skip Question
              </button>
              <button 
                className="btn-next" 
                onClick={handleNext}
                disabled={!answers[currentQuestion.field]}
              >
                Save & Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Calculate Button (shows when significant progress made) */}
      {currentQuestionIndex >= totalQuestions * 0.5 && (
        <div className="calculate-prompt">
          <button className="btn-calculate" onClick={() => {
            calculateEmissions();
            setShowResults(true);
          }}>
            📊 Calculate Carbon Footprint
          </button>
        </div>
      )}
    </div>
  );
};

export default ManualLoggingQuestionnaire;
