import React, { useState } from 'react';

const DataSources = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sources = [
    {
      name: 'IPCC Sixth Assessment Report (AR6)',
      url: 'https://www.ipcc.ch/assessment-report/ar6/',
      description: 'Comprehensive climate science assessment',
      icon: '📚'
    },
    {
      name: 'Our World in Data',
      url: 'https://ourworldindata.org/co2-emissions',
      description: 'Global emissions statistics and analysis',
      icon: '📊'
    },
    {
      name: 'International Energy Agency (IEA)',
      url: 'https://www.iea.org/data-and-statistics',
      description: 'Energy and emissions data worldwide',
      icon: '⚡'
    },
    {
      name: 'NOAA Climate.gov',
      url: 'https://www.climate.gov/',
      description: 'Atmospheric CO₂ monitoring and research',
      icon: '🌡️'
    },
    {
      name: 'United Nations Climate Change',
      url: 'https://unfccc.int/',
      description: 'Official climate action framework',
      icon: '🌍'
    }
  ];

  return (
    <section className="py-12 px-4 bg-gray-900 border-t border-gray-800">
      <div className="max-w-6xl mx-auto">
        {/* Expandable header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-3 text-gray-400 hover:text-yellow-400 transition-colors duration-300 mb-6"
        >
          <span className="text-2xl">ℹ️</span>
          <span className="font-semibold text-lg">Data Source Transparency</span>
          <span className={`text-2xl transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {/* Expandable content */}
        <div
          className={`overflow-hidden transition-all duration-500 ${
            isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg rounded-2xl p-8 border border-yellow-500/20">
            <div className="text-center mb-8">
              <h3 className="text-white text-2xl font-bold mb-3">
                Our Data Sources
              </h3>
              <p className="text-gray-400 max-w-3xl mx-auto">
                All statistics and information on CarbonMeter are sourced from globally
                recognized climate research organizations and peer-reviewed scientific data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-yellow-500 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                      {source.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold mb-2 group-hover:text-yellow-400 transition-colors duration-300">
                        {source.name}
                      </h4>
                      <p className="text-gray-400 text-sm mb-3">
                        {source.description}
                      </p>
                      <div className="flex items-center gap-2 text-yellow-400 text-sm font-semibold">
                        <span>Visit Source</span>
                        <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Verification badge */}
            <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-6 border border-green-500/30">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">✅</span>
                  <div>
                    <div className="text-white font-bold text-lg">Verified Data</div>
                    <div className="text-gray-400 text-sm">Peer-reviewed scientific sources</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🔒</span>
                  <div>
                    <div className="text-white font-bold text-lg">Transparent Methodology</div>
                    <div className="text-gray-400 text-sm">Open-source calculations</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🔄</span>
                  <div>
                    <div className="text-white font-bold text-lg">Regular Updates</div>
                    <div className="text-gray-400 text-sm">Latest climate data</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info tooltip */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/30">
                <span className="text-yellow-400 text-xl">💡</span>
                <span className="text-yellow-400 text-sm font-semibold">
                  All statistics are from globally recognized climate research organizations
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataSources;
