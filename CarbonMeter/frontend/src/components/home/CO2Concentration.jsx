import React, { useState } from 'react';
import CountUp from 'react-countup';

const CO2Concentration = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-gray-900 via-green-950 to-gray-900">
      <div className="max-w-5xl mx-auto">
        <div className="relative bg-gradient-to-br from-yellow-900/20 to-red-900/20 backdrop-blur-lg rounded-3xl p-12 border-2 border-yellow-500/40 shadow-2xl overflow-hidden">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-red-500/10 animate-pulse"></div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                🌍 Atmospheric CO₂ Concentration
              </h2>
              <p className="text-gray-300 text-lg">
                Current levels of carbon dioxide in our atmosphere
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Current Level */}
              <div className="bg-gray-900/60 rounded-2xl p-8 border border-yellow-500/30 hover:border-yellow-500 transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-center">
                  <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                    Current Level (2024)
                  </div>
                  <div className="text-yellow-400 font-black text-6xl md:text-7xl mb-2">
                    <CountUp end={420} duration={3} delay={0.5} />
                    <span className="text-3xl ml-2">ppm</span>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-full border border-red-500/50">
                    <span className="text-red-400 text-2xl">⚠️</span>
                    <span className="text-red-300 font-semibold">Record High</span>
                  </div>
                </div>
              </div>

              {/* Pre-Industrial Level */}
              <div className="bg-gray-900/60 rounded-2xl p-8 border border-green-500/30 hover:border-green-500 transition-all duration-300 hover:transform hover:scale-105">
                <div className="text-center">
                  <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                    Pre-Industrial Level
                  </div>
                  <div className="text-green-400 font-black text-6xl md:text-7xl mb-2">
                    <CountUp end={280} duration={3} delay={0.5} />
                    <span className="text-3xl ml-2">ppm</span>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-full border border-green-500/50">
                    <span className="text-green-400 text-2xl">✓</span>
                    <span className="text-green-300 font-semibold">Historical Baseline</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Increase indicator */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500/10 to-red-500/10 px-6 py-3 rounded-full border border-yellow-500/50">
                <span className="text-4xl">📈</span>
                <span className="text-white font-bold text-xl">
                  <CountUp end={50} duration={2.5} delay={1} />% Increase
                </span>
              </div>
            </div>

            {/* Warning message with tooltip */}
            <div className="relative">
              <div
                className="bg-gradient-to-r from-red-900/40 to-yellow-900/40 rounded-2xl p-6 border border-yellow-500/50 cursor-help"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">⚡</span>
                  <div className="flex-1">
                    <p className="text-white text-lg font-semibold mb-2">
                      Critical Milestone Reached
                    </p>
                    <p className="text-gray-300 leading-relaxed">
                      "Highest atmospheric CO₂ concentration in at least{' '}
                      <span className="text-yellow-400 font-bold">800,000 years</span>.
                      This unprecedented rise is directly linked to human activities and poses
                      significant risks to global climate stability."
                    </p>
                  </div>
                </div>

                {showTooltip && (
                  <div className="absolute -top-2 right-4 bg-gray-900 border-2 border-yellow-500 px-4 py-2 rounded-lg shadow-2xl animate-fadeIn">
                    <p className="text-yellow-400 text-sm font-semibold">
                      ℹ️ Hover for more info
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Source */}
            <div className="text-center mt-8 pt-6 border-t border-gray-700">
              <p className="text-gray-400 text-sm">
                Data Source:{' '}
                <span className="text-yellow-400 font-semibold">
                  NOAA Climate Observatory / Mauna Loa Observatory
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </section>
  );
};

export default CO2Concentration;
