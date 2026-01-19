import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const InteractiveGraph = () => {
  const [view, setView] = useState('global');

  const globalData = [
    { year: '1990', emissions: 22.7 },
    { year: '1995', emissions: 23.5 },
    { year: '2000', emissions: 25.2 },
    { year: '2005', emissions: 28.9 },
    { year: '2010', emissions: 32.8 },
    { year: '2015', emissions: 35.3 },
    { year: '2020', emissions: 34.8 },
    { year: '2024', emissions: 37.4 }
  ];

  const indiaData = [
    { year: '1990', emissions: 0.6 },
    { year: '1995', emissions: 0.9 },
    { year: '2000', emissions: 1.2 },
    { year: '2005', emissions: 1.5 },
    { year: '2010', emissions: 1.9 },
    { year: '2015', emissions: 2.3 },
    { year: '2020', emissions: 2.4 },
    { year: '2024', emissions: 2.6 }
  ];

  const data = view === 'global' ? globalData : indiaData;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border-2 border-yellow-500 p-4 rounded-lg shadow-xl">
          <p className="text-white font-semibold mb-1">Year: {label}</p>
          <p className="text-yellow-400 text-xl font-bold">
            {payload[0].value.toFixed(1)} Gt CO₂
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="py-16 px-4 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            📈 Emissions Trend Analysis
          </h2>
          <p className="text-gray-300 text-lg">
            Historical carbon dioxide emissions growth over time
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg rounded-3xl p-8 border border-yellow-500/20">
          {/* Toggle buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setView('global')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                view === 'global'
                  ? 'bg-yellow-500 text-gray-900 shadow-xl shadow-yellow-500/50'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              🌍 Global Emissions
            </button>
            <button
              onClick={() => setView('india')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                view === 'india'
                  ? 'bg-yellow-500 text-gray-900 shadow-xl shadow-yellow-500/50'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              🇮🇳 India Emissions
            </button>
          </div>

          {/* Chart */}
          <div className="h-96 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="year"
                  stroke="#9CA3AF"
                  style={{ fontSize: '14px', fontWeight: 'bold' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '14px', fontWeight: 'bold' }}
                  label={{
                    value: 'CO₂ Emissions (Gigatons)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#F59E0B', fontWeight: 'bold' }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="emissions"
                  stroke="#F59E0B"
                  strokeWidth={4}
                  dot={{
                    fill: '#F59E0B',
                    strokeWidth: 2,
                    r: 6,
                    stroke: '#fff'
                  }}
                  activeDot={{
                    r: 8,
                    fill: '#FBBF24',
                    stroke: '#fff',
                    strokeWidth: 3
                  }}
                  animationDuration={1500}
                  animationBegin={0}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Starting Point (1990)</div>
              <div className="text-yellow-400 text-3xl font-bold">
                {view === 'global' ? '22.7' : '0.6'} Gt
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Current (2024)</div>
              <div className="text-yellow-400 text-3xl font-bold">
                {view === 'global' ? '37.4' : '2.6'} Gt
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-6 border border-red-500/50">
              <div className="text-gray-400 text-sm mb-1">Increase</div>
              <div className="text-red-400 text-3xl font-bold flex items-center gap-2">
                <span>📈</span>
                {view === 'global' ? '+64%' : '+333%'}
              </div>
            </div>
          </div>

          {/* Insight box */}
          <div className="mt-6 bg-gradient-to-r from-yellow-900/20 to-red-900/20 rounded-xl p-6 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <span className="text-3xl">💡</span>
              <div>
                <p className="text-white font-semibold mb-2">Key Insight</p>
                <p className="text-gray-300 leading-relaxed">
                  {view === 'global'
                    ? 'Global CO₂ emissions have increased by 64% since 1990, despite growing awareness and climate commitments. Urgent action is needed to reverse this trend.'
                    : "India's emissions have grown 333% since 1990, reflecting rapid industrialization. However, per-capita emissions remain below the global average, showing efficiency potential."}
                </p>
              </div>
            </div>
          </div>

          {/* Source */}
          <div className="text-center mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              Data Source: <span className="text-yellow-400">International Energy Agency (IEA) & Global Carbon Project</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveGraph;
