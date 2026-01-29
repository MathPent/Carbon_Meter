import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './OrgCompare.css';

const OrgCompare = () => {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState(null);
  const [peers, setPeers] = useState(null);
  const [benchmarks, setBenchmarks] = useState(null);
  const [percentile, setPercentile] = useState(null);
  const [practices, setPractices] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [dataSource, setDataSource] = useState('real'); // 'real' or 'predicted'
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllCompareData();
  }, [dataSource]);

  const fetchAllCompareData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch all endpoints in parallel (updated to /api/org/*)
      const [leaderboardRes, peersRes, benchmarksRes, percentileRes, practicesRes] = await Promise.all([
        fetch('http://localhost:5000/api/organization/leaderboard', { headers }),
        fetch('http://localhost:5000/api/org/peers', { headers }),
        fetch('http://localhost:5000/api/org/benchmarks', { headers }),
        fetch('http://localhost:5000/api/organization/compare/percentile', { headers }),
        fetch('http://localhost:5000/api/organization/best-practices', { headers }),
      ]);

      const leaderboardData = await leaderboardRes.json();
      const peersData = await peersRes.json();
      const benchmarksData = await benchmarksRes.json();
      const percentileData = await percentileRes.json();
      const practicesData = await practicesRes.json();

      setLeaderboard(leaderboardData);
      setPeers(peersData);
      setBenchmarks(benchmarksData);
      setPercentile(percentileData);
      setPractices(practicesData);

      // Fetch ML prediction if in predicted mode
      if (dataSource === 'predicted') {
        await fetchPrediction(headers);
      }
    } catch (err) {
      console.error('Error fetching compare data:', err);
      setError('Failed to load comparison data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrediction = async (headers) => {
    try {
      const response = await fetch('http://localhost:5000/api/org/prediction', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          period: 'next-month', // Can be 'next-month', 'next-quarter', 'next-year'
        }),
      });

      if (response.ok) {
        const predictionData = await response.json();
        setPrediction(predictionData);
      } else {
        console.error('Prediction API failed:', response.status);
        setPrediction(null);
      }
    } catch (err) {
      console.error('Error fetching prediction:', err);
      setPrediction(null);
    }
  };

  if (loading) {
    return (
      <div className="org-compare">
        <div className="compare-header">
          <h1>Industry Comparison</h1>
          <p>Compare your emissions with industry peers and benchmarks</p>
        </div>
        <div className="compare-content">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="org-compare">
        <div className="compare-header">
          <h1>Industry Comparison</h1>
          <p>Compare your emissions with industry peers and benchmarks</p>
        </div>
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <h2>Unable to Load Data</h2>
          <p>{error}</p>
          <button onClick={fetchAllCompareData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="org-compare">
      <div className="compare-header">
        <h1>Industry Comparison</h1>
        <p>Compare your emissions with industry peers and benchmarks</p>

        {/* ✅ Data Source Toggle */}
        <div className="data-source-toggle">
          <button
            className={`toggle-btn ${dataSource === 'real' ? 'active' : ''}`}
            onClick={() => setDataSource('real')}
          >
            📊 Real Data
          </button>
          <button
            className={`toggle-btn ${dataSource === 'predicted' ? 'active' : ''}`}
            onClick={() => setDataSource('predicted')}
          >
            🤖 AI Predicted
          </button>
        </div>

        {/* ✅ Show demo badge only when any API returns demo:true */}
        {(leaderboard?.demo || peers?.demo || benchmarks?.demo || percentile?.demo || practices?.demo) && (
          <div className="demo-badge">
            <span className="badge-icon">ℹ️</span>
            <span className="badge-text">Benchmarking uses industry-representative datasets for demonstration where organization data is incomplete</span>
          </div>
        )}
      </div>

      <div className="compare-content">
        {/* ✅ ML Prediction Card (only in predicted mode) */}
        {dataSource === 'predicted' && prediction && (
          <PredictionCard data={prediction} />
        )}

        {/* 4. Performance Percentile - Top Priority */}
        <PercentileCard data={percentile} />

        {/* 3. Sector Benchmarks */}
        <BenchmarksCard data={benchmarks} />

        {/* 2. Peer Comparison */}
        <PeersCard data={peers} />

        {/* 1. Leaderboard */}
        <LeaderboardCard data={leaderboard} />

        {/* 5. Best Practices */}
        <BestPracticesCard data={practices} />
      </div>
    </div>
  );
};

// ML Prediction Card Component
const PredictionCard = ({ data }) => {
  if (!data || !data.prediction) {
    return null;
  }

  const { prediction, organizationId, period } = data;
  const { predicted_emission, trend, confidence, benchmark_percentile, source } = prediction;

  const trendIcon = trend === 'increasing' ? '📈' : trend === 'decreasing' ? '📉' : '➡️';
  const trendColor = trend === 'increasing' ? '#ef4444' : trend === 'decreasing' ? '#10b981' : '#f59e0b';

  return (
    <div className="compare-card prediction-card">
      <h2>🤖 AI-Powered Emission Prediction</h2>
      <p className="card-subtitle">Forecast for {period} • {source === 'ml' ? 'ML Model' : 'Statistical Estimate'}</p>

      <div className="prediction-content">
        <div className="prediction-main">
          <div className="prediction-value">
            <span className="value-label">Predicted Emission</span>
            <span className="value-number">{predicted_emission?.toFixed(2) || 0} tCO₂e</span>
          </div>

          <div className="prediction-trend" style={{ color: trendColor }}>
            <span className="trend-icon">{trendIcon}</span>
            <span className="trend-text">{trend || 'stable'} trend</span>
          </div>
        </div>

        <div className="prediction-stats">
          <div className="stat-item">
            <span className="stat-label">Confidence</span>
            <span className="stat-value">{confidence ? `${(confidence * 100).toFixed(0)}%` : 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Benchmark Percentile</span>
            <span className="stat-value">{benchmark_percentile ? `${benchmark_percentile}%` : 'N/A'}</span>
          </div>
        </div>

        <div className="prediction-disclaimer">
          <span className="disclaimer-icon">ℹ️</span>
          <span className="disclaimer-text">
            Predictions are based on {source === 'ml' ? 'XGBoost ML model trained on industry data' : 'historical emission patterns and statistical analysis'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Percentile Card Component
const PercentileCard = ({ data }) => {
  if (!data || data.insufficientData) {
    return (
      <div className="compare-card empty-state">
        <h2>📈 Performance Percentile Ranking</h2>
        <p className="empty-message">{data?.message || 'Add emission data to see your percentile ranking.'}</p>
      </div>
    );
  }

  const { percentile, color, sector, statement } = data;
  
  const colorMap = {
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444',
  };

  return (
    <div className="compare-card percentile-card">
      <h2>📈 Performance Percentile Ranking</h2>
      <div className="percentile-content">
        <div className="percentile-circle" style={{ borderColor: colorMap[color] || '#3b82f6' }}>
          <div className="percentile-value" style={{ color: colorMap[color] || '#3b82f6' }}>
            {percentile}%
          </div>
        </div>
        <div className="percentile-text">
          <p className="percentile-statement">{statement}</p>
          <p className="percentile-subtitle">Based on emissions per employee in {sector}</p>
        </div>
      </div>
      <div className="percentile-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#10b981' }}></div>
          <span>Top Performer (&gt;70%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#f59e0b' }}></div>
          <span>Average (40-70%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ef4444' }}></div>
          <span>Needs Improvement (&lt;40%)</span>
        </div>
      </div>
    </div>
  );
};

// Benchmarks Card Component
const BenchmarksCard = ({ data }) => {
  if (!data || data.insufficientData || !data.yourOrg || !data.benchmarks) {
    return (
      <div className="compare-card empty-state">
        <h2>🎯 Sector-Specific Benchmarks</h2>
        <p className="empty-message">{data?.message || 'Add employee count and emission data to see benchmarks.'}</p>
      </div>
    );
  }

  const { sector, benchmarks: bm, yourOrg } = data;
  const { perEmployeeYear = 0, label = 'Unknown', bucket = 'unknown' } = yourOrg || {};

  const getProgressWidth = () => {
    const { excellentMax, averageMax } = bm;
    if (bucket === 'excellent') return Math.min((perEmployeeYear / excellentMax) * 33, 33);
    if (bucket === 'average') return 33 + Math.min(((perEmployeeYear - excellentMax) / (averageMax - excellentMax)) * 34, 34);
    return 67 + Math.min(((perEmployeeYear - averageMax) / averageMax) * 33, 33);
  };

  const progressWidth = getProgressWidth();
  const bucketColor = bucket === 'excellent' ? '#10b981' : bucket === 'average' ? '#f59e0b' : '#ef4444';

  return (
    <div className="compare-card benchmarks-card">
      <h2>🎯 Sector-Specific Benchmarks</h2>
      <div className="benchmark-info">
        <p className="benchmark-sector">{sector} Industry Standards</p>
        <p className="benchmark-label" style={{ color: bucketColor }}>{label}</p>
      </div>
      
      {data.industryData && (
        <div className="industry-stats">
          <div className="industry-stat">
            <span className="stat-label">Industry Average</span>
            <span className="stat-value">{data.industryData.industryAverage} tCO₂e/employee</span>
          </div>
          <div className="industry-stat">
            <span className="stat-label">Best-in-Class</span>
            <span className="stat-value">{data.industryData.bestInClass} tCO₂e/employee</span>
          </div>
        </div>
      )}
      
      <div className="benchmark-bar-container">
        <div className="benchmark-bar">
          <div className="benchmark-segment excellent">
            <span className="segment-label">Excellent</span>
            <span className="segment-range">{bm.excellent}</span>
          </div>
          <div className="benchmark-segment average">
            <span className="segment-label">Average</span>
            <span className="segment-range">{bm.average}</span>
          </div>
          <div className="benchmark-segment high">
            <span className="segment-label">High</span>
            <span className="segment-range">{bm.high}</span>
          </div>
        </div>
        <div className="benchmark-marker" style={{ left: `${progressWidth}%`, borderColor: bucketColor }}>
          <div className="marker-label">You: {perEmployeeYear.toFixed(1)}</div>
        </div>
      </div>

      <div className="benchmark-your-position">
        <strong>Your Position:</strong> {perEmployeeYear.toFixed(2)} tCO₂e per employee per year
      </div>
    </div>
  );
};

// Peers Card Component
const PeersCard = ({ data }) => {
  if (!data || data.insufficientData || !data.yourOrganization) {
    return (
      <div className="compare-card empty-state">
        <h2>📊 Peer-to-Peer Comparison</h2>
        <p className="empty-message">{data?.message || 'Not enough data for peer comparison yet.'}</p>
      </div>
    );
  }

  const { sector, yourOrganization, benchmarks, peers = [] } = data;

  const chartData = [
    {
      name: 'Your Org',
      'CO₂/Employee': yourOrganization?.perEmployeeYear || 0,
    },
    {
      name: 'Best',
      'CO₂/Employee': benchmarks?.best?.perEmployeeYear || 0,
    },
    {
      name: 'Average',
      'CO₂/Employee': benchmarks?.average?.perEmployeeYear || 0,
    },
    {
      name: 'Worst',
      'CO₂/Employee': benchmarks?.worst?.perEmployeeYear || 0,
    },
  ];

  return (
    <div className="compare-card peers-card">
      <h2>📊 Peer-to-Peer Comparison</h2>
      <p className="card-subtitle">Comparing against {sector} sector organizations</p>

      <div className="peers-chart">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'tCO₂e/employee', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="CO₂/Employee" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ✅ Display peer company logos and names */}
      {peers && peers.length > 0 && (
        <div className="peers-list">
          <h3>Top Companies in {sector}</h3>
          <div className="peers-carousel">
            {peers.map((peer, idx) => (
              <div key={idx} className="peer-item">
                <div className="peer-logo-fallback">
                  {peer.name?.charAt(0) || '?'}
                </div>
                <span className="peer-name">{peer.name}</span>
                <span className="peer-emission">{peer.emissionPerEmployee?.toFixed(1)} tCO₂e</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="peers-stats">
        <div className="peer-stat">
          <span className="stat-label">Your Organization</span>
          <span className="stat-value">{(yourOrganization?.totalYearEmissions || 0).toFixed(1)} tCO₂e/year</span>
          <span className="stat-subvalue">{(yourOrganization?.perEmployeeYear || 0).toFixed(2)} tCO₂e per employee</span>
        </div>
        <div className="peer-stat">
          <span className="stat-label">Sector Best</span>
          <span className="stat-value">{benchmarks?.best?.name || 'N/A'}</span>
          <span className="stat-subvalue">{(benchmarks?.best?.perEmployeeYear || 0).toFixed(2)} tCO₂e per employee</span>
        </div>
        <div className="peer-stat">
          <span className="stat-label">Sector Average</span>
          <span className="stat-value">{(benchmarks?.average?.perEmployeeYear || 0).toFixed(2)} tCO₂e/employee</span>
          <span className="stat-subvalue">Across {data.totalOrganizations || 0} companies</span>
        </div>
      </div>
    </div>
  );
};

// Leaderboard Card Component
const LeaderboardCard = ({ data }) => {
  if (!data || data.insufficientData || !data.items || !Array.isArray(data.items)) {
    return (
      <div className="compare-card empty-state">
        <h2>🏆 Industry Leaderboard Rankings</h2>
        <p className="empty-message">{data?.message || 'Not enough organizations for a leaderboard yet.'}</p>
      </div>
    );
  }

  const { sector, items, totalOrganizations } = data;

  return (
    <div className="compare-card leaderboard-card">
      <h2>🏆 Industry Leaderboard Rankings</h2>
      <p className="card-subtitle">{sector} sector • {totalOrganizations} organizations</p>

      <div className="leaderboard-table">
        <div className="table-header">
          <div className="col-rank">Rank</div>
          <div className="col-org">Organization</div>
          <div className="col-emissions">Total Emissions</div>
          <div className="col-intensity">CO₂/Employee</div>
          <div className="col-badge">Badge</div>
        </div>
        {items.map((item) => (
          <div key={item.rank} className={`table-row ${item.isUser ? 'highlight-user' : ''}`}>
            <div className="col-rank">
              <span className="rank-badge">{item.rank}</span>
            </div>
            <div className="col-org">
              {/* ✅ Show company avatar with first letter */}
              <div className="org-avatar">
                {(item.name || item.organizationName)?.charAt(0) || 'O'}
              </div>
              <span className="org-name">{item.name || item.organizationName}</span>
              {item.isUser && <span className="you-badge">YOU</span>}
            </div>
            <div className="col-emissions">
              {`${item.totalEmissions?.toFixed(1) || 0} tCO₂e`}
            </div>
            <div className="col-intensity">
              {`${item.emissionsPerEmployee?.toFixed(2) || 0} tCO₂e`}
            </div>
            <div className="col-badge">
              {item.badge && <span className="badge-chip">{item.badge}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Best Practices Card Component
const BestPracticesCard = ({ data }) => {
  if (!data || data.insufficientData || !data.recommendations || !Array.isArray(data.recommendations)) {
    return (
      <div className="compare-card empty-state">
        <h2>🌟 Best Practices Showcase</h2>
        <p className="empty-message">{data?.message || 'Log activities to unlock tailored recommendations.'}</p>
      </div>
    );
  }

  const { sector, recommendations, emissionLevel = 'medium' } = data;

  return (
    <div className="compare-card practices-card">
      <h2>🌟 Best Practices Showcase</h2>
      <p className="card-subtitle">Actionable recommendations for {sector} ({emissionLevel} emission level)</p>

      <div className="practices-grid">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="practice-item" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="practice-icon">{rec.icon || '💡'}</div>
            <div className="practice-content">
              <h3 className="practice-title">{rec.title}</h3>
              <span className="practice-category-badge">{rec.category || 'General'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="skeleton-container">
    <div className="skeleton-card">
      <div className="skeleton-header"></div>
      <div className="skeleton-content"></div>
      <div className="skeleton-content"></div>
    </div>
    <div className="skeleton-card">
      <div className="skeleton-header"></div>
      <div className="skeleton-content"></div>
    </div>
    <div className="skeleton-card">
      <div className="skeleton-header"></div>
      <div className="skeleton-content"></div>
    </div>
  </div>
);

export default OrgCompare;
