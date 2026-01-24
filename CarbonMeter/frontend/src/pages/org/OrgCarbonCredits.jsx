import React from 'react';
import './OrgAnalytics.css';

const OrgCarbonCredits = () => {
  return (
    <div className="org-carbon-credits">
      <div className="credits-header">
        <h1>Carbon Credits</h1>
        <p>Offset your emissions by purchasing verified carbon credits</p>
      </div>

      <div className="coming-soon">
        <span className="icon">🪙</span>
        <h2>Carbon Credits Marketplace</h2>
        <p>Purchase verified carbon credits to offset your organization's emissions</p>
        <ul>
          <li>🌳 1 credit = 1 tCO₂e offset</li>
          <li>💰 Market rate: ₹500 - ₹3,000 per credit</li>
          <li>✅ Verified carbon offset projects</li>
          <li>📜 Certificate generation</li>
          <li>📊 Offset tracking & reporting</li>
        </ul>
      </div>
    </div>
  );
};

export default OrgCarbonCredits;
