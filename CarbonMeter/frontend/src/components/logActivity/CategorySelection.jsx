import React from 'react';
import './CategorySelection.css';

const CategorySelection = ({ onSelect }) => {
  const categories = [
    {
      id: 'transport',
      icon: '🚗',
      title: 'Transport',
      description: 'Road, Rail, and Air travel emissions',
      examples: 'Car, Bus, Train, Flight'
    },
    {
      id: 'electricity',
      icon: '⚡',
      title: 'Electricity',
      description: 'Household and office electricity consumption',
      examples: 'Grid, DG, Solar'
    },
    {
      id: 'food',
      icon: '🍽️',
      title: 'Food',
      description: 'Diet-based emissions from food consumption',
      examples: 'Animal-based, Plant-based'
    },
    {
      id: 'waste',
      icon: '🗑️',
      title: 'Waste',
      description: 'Food waste, solid waste, and liquid waste',
      examples: 'Food waste, Garbage'
    }
  ];

  return (
    <div className="category-selection">
      <h2 className="category-title">Select Activity Category</h2>
      <p className="category-subtitle">Choose the type of activity you want to log</p>

      <div className="category-grid">
        {categories.map((category) => (
          <button
            key={category.id}
            className="category-card"
            onClick={() => onSelect(category.id)}
          >
            <div className="category-icon">{category.icon}</div>
            <h3>{category.title}</h3>
            <p className="category-desc">{category.description}</p>
            <p className="category-examples">
              <strong>Examples:</strong> {category.examples}
            </p>
            <div className="category-arrow">→</div>
          </button>
        ))}
      </div>

      <div className="category-info">
        <p>
          <span className="info-badge">ℹ️ Note:</span>
          All calculations use government-approved emission factors (IPCC, MoEFCC, CPCB)
        </p>
      </div>
    </div>
  );
};

export default CategorySelection;
