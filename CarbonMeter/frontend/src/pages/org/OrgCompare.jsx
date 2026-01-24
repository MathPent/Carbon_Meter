import React from 'react';
import './OrgAnalytics.css';

const OrgCompare = () => {
  return (
    <div className="org-compare">
      <div className="compare-header">
        <h1>Industry Comparison</h1>
        <p>Compare your emissions with industry peers and benchmarks</p>
      </div>

      <div className="coming-soon">
        <span className="icon">⚖️</span>
        <h2>Benchmarking & Leaderboard</h2>
        <p>See how your organization ranks in emission reduction efforts</p>
        <ul>
          <li>🏆 Industry leaderboard rankings</li>
          <li>📊 Peer-to-peer comparison</li>
          <li>🎯 Sector-specific benchmarks</li>
          <li>🌟 Best practices showcase</li>
          <li>📈 Performance percentile ranking</li>
        </ul>
      </div>
    </div>
  );
};

export default OrgCompare;
