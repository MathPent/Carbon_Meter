import React from 'react';
import CountUp from 'react-countup';

const IndiaStats = () => {
  const stats = [
    {
      icon: '🇮🇳',
      value: 7,
      suffix: '%',
      label: 'of Global CO₂ Emissions',
      description: 'India\'s contribution to worldwide emissions'
    },
    {
      icon: '⚡',
      value: 44,
      suffix: '%',
      label: 'Power Sector',
      description: 'Largest emission source in India'
    },
    {
      icon: '🏭',
      value: 26,
      suffix: '%',
      label: 'Industry',
      description: 'Manufacturing & construction emissions'
    },
    {
      icon: '🚗',
      value: 13,
      suffix: '%',
      label: 'Transport',
      description: 'Road, rail, and air transport'
    },
    {
      icon: '👤',
      value: 2,
      suffix: ' tCO₂/year',
      label: 'Per-Capita Emissions',
      description: 'Global average ≈ 4.7 tCO₂/year',
      isDecimal: true
    }
  ];

  return (
    <section className="py-16 px-4 bg-green-950 relative overflow-hidden">
      {/* India map watermark */}
      <div className="absolute inset-0 opacity-5">
        <div className="text-9xl text-yellow-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          🇮🇳
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12 animate-fadeIn">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            India's Carbon Footprint
          </h2>
          <p className="text-gray-300 text-lg">
            Key statistics about India's greenhouse gas emissions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/20 hover:border-yellow-500/60 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20"
              style={{
                animation: `slideUp 0.6s ease-out ${index * 0.1}s both`
              }}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/5 rounded-2xl transition-all duration-500"></div>

              <div className="relative z-10">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>

                <div className="mb-3">
                  <div className="text-yellow-400 font-bold text-4xl mb-1">
                    <CountUp
                      end={stat.value}
                      duration={2.5}
                      decimals={stat.isDecimal ? 1 : 0}
                      delay={0.5}
                    />
                    <span className="text-2xl">{stat.suffix}</span>
                  </div>
                  <div className="text-white font-semibold text-lg mb-2">
                    {stat.label}
                  </div>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed">
                  {stat.description}
                </p>
              </div>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-bl-full group-hover:bg-yellow-500/20 transition-all duration-500"></div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            Data Source: <span className="text-yellow-400">International Energy Agency (IEA) & UNFCCC</span>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </section>
  );
};

export default IndiaStats;
