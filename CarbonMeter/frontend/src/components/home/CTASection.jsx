import React from 'react';
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-green-950 via-gray-900 to-green-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-2xl rounded-3xl p-12 md:p-16 border-2 border-yellow-500/50 shadow-2xl">
          {/* Icon */}
          <div className="text-center mb-8">
            <div className="inline-block text-7xl mb-6 animate-bounce">
              🎯
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-6 leading-tight">
            Understand Your Impact.{' '}
            <span className="text-yellow-400 block mt-2">
              Take Control of Your Carbon Footprint.
            </span>
          </h2>

          {/* Description */}
          <p className="text-gray-300 text-xl text-center mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of climate-conscious individuals making a real difference.
            Start tracking, understanding, and reducing your emissions today.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => navigate('/auth')}
              className="group relative bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold text-lg px-10 py-5 rounded-xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/50 w-full sm:w-auto"
            >
              <span className="flex items-center justify-center gap-3">
                <span>✅</span>
                <span>Calculate Your Carbon Footprint</span>
              </span>
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-xl"></div>
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="group bg-transparent border-3 border-white hover:bg-white text-white hover:text-gray-900 font-bold text-lg px-10 py-5 rounded-xl transition-all duration-300 hover:scale-105 shadow-xl w-full sm:w-auto"
            >
              <span className="flex items-center justify-center gap-3">
                <span>🌍</span>
                <span>Explore Carbon Map</span>
              </span>
            </button>
          </div>

          {/* Stats below buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-gray-700">
            <div className="text-center">
              <div className="text-yellow-400 font-black text-3xl mb-2">10K+</div>
              <div className="text-gray-400 text-sm">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-black text-3xl mb-2">500K+</div>
              <div className="text-gray-400 text-sm">Tons CO₂ Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-black text-3xl mb-2">245</div>
              <div className="text-gray-400 text-sm">Tons Saved</div>
            </div>
            <div className="text-center">
              <div className="text-yellow-400 font-black text-3xl mb-2">50+</div>
              <div className="text-gray-400 text-sm">Countries</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-bounce {
          animation: bounce 2s infinite;
        }

        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </section>
  );
};

export default CTASection;
