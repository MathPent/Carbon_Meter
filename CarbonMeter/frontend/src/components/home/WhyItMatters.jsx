import React, { useEffect, useRef, useState } from 'react';

const WhyItMatters = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const points = [
    {
      icon: '🌡️',
      title: 'Temperature Rising',
      description: 'Global temperature has increased by ~1.1°C since pre-industrial times',
      color: 'from-red-500 to-orange-500'
    },
    {
      icon: '❄️',
      title: 'Critical Threshold',
      description: 'Crossing 1.5°C increases frequency of climate disasters exponentially',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '🏭',
      title: 'Daily Impact',
      description: 'Majority of emissions come from everyday energy consumption and activities',
      color: 'from-yellow-500 to-amber-500'
    },
    {
      icon: '📉',
      title: 'First Step',
      description: 'Measurement is the essential first step toward meaningful emissions reduction',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  useEffect(() => {
    const currentRef = sectionRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-16 px-4 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🔍 Why Carbon Footprint Matters
          </h2>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Understanding the urgency of climate action and why tracking emissions is crucial
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((point, index) => (
            <div
              key={index}
              className={`group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-yellow-500 transition-all duration-500 ${
                isVisible ? 'animate-slideUp' : 'opacity-0'
              }`}
              style={{
                animationDelay: `${index * 0.15}s`
              }}
            >
              {/* Glass effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl pointer-events-none"></div>

              {/* Icon with gradient background */}
              <div className="relative mb-4">
                <div className={`absolute inset-0 bg-gradient-to-br ${point.color} opacity-20 blur-xl rounded-full group-hover:opacity-30 transition-opacity duration-500`}></div>
                <div className="relative text-6xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  {point.icon}
                </div>
              </div>

              <h3 className="text-white font-bold text-xl mb-3 group-hover:text-yellow-400 transition-colors duration-300">
                {point.title}
              </h3>

              <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                {point.description}
              </p>

              {/* Bottom accent line */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${point.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-2xl`}></div>
            </div>
          ))}
        </div>

        {/* Additional emphasis section */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-yellow-500/10 backdrop-blur-lg rounded-2xl p-8 border border-yellow-500/30">
            <p className="text-white text-xl md:text-2xl font-semibold mb-2">
              💡 Key Insight
            </p>
            <p className="text-gray-300 text-lg max-w-2xl">
              Individual actions, when multiplied across billions of people,
              create the collective change needed to combat climate change
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default WhyItMatters;
