import React, { useState, useEffect } from 'react';

const QuoteCarousel = () => {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const quotes = [
    {
      text: "You can't manage what you don't measure.",
      author: 'Peter Drucker',
      icon: '📊'
    },
    {
      text: 'There is no planet B — but there is still a choice.',
      author: 'Climate Scientists',
      icon: '🌍'
    },
    {
      text: 'Carbon emissions are invisible — but their impact is everywhere.',
      author: 'Environmental Truth',
      icon: '👁️'
    },
    {
      text: 'Track it. Understand it. Reduce it.',
      author: 'CarbonMeter Mission',
      icon: '✅'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuote((prev) => (prev + 1) % quotes.length);
        setIsTransitioning(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [quotes.length]);

  const goToQuote = (index) => {
    if (index !== currentQuote) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuote(index);
        setIsTransitioning(false);
      }, 500);
    }
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-green-950 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-yellow-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-2xl rounded-3xl p-12 md:p-16 border border-yellow-500/30 shadow-2xl min-h-[400px] flex flex-col justify-center">
          {/* Quote icon */}
          <div className="text-yellow-400 text-7xl md:text-9xl absolute top-8 left-8 opacity-20">
            "
          </div>
          <div className="text-yellow-400 text-7xl md:text-9xl absolute bottom-8 right-8 opacity-20 rotate-180">
            "
          </div>

          {/* Quote content */}
          <div className={`text-center transition-all duration-500 ${isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'}`}>
            {/* Icon */}
            <div className="text-6xl mb-6 animate-bounce">
              {quotes[currentQuote].icon}
            </div>

            {/* Quote text */}
            <blockquote className="text-white text-2xl md:text-4xl font-bold leading-relaxed mb-6 px-4">
              {quotes[currentQuote].text}
            </blockquote>

            {/* Author */}
            <cite className="not-italic text-yellow-400 text-lg md:text-xl font-semibold">
              — {quotes[currentQuote].author}
            </cite>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center gap-3 mt-12">
            {quotes.map((_, index) => (
              <button
                key={index}
                onClick={() => goToQuote(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentQuote === index
                    ? 'bg-yellow-400 w-8'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to quote ${index + 1}`}
              ></button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 rounded-b-3xl overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all"
              style={{
                width: `${((currentQuote + 1) / quotes.length) * 100}%`,
                transition: 'width 0.5s ease-in-out'
              }}
            ></div>
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={() => goToQuote((currentQuote - 1 + quotes.length) % quotes.length)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-yellow-500 hover:bg-yellow-400 text-gray-900 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xl"
          aria-label="Previous quote"
        >
          ←
        </button>
        <button
          onClick={() => goToQuote((currentQuote + 1) % quotes.length)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-yellow-500 hover:bg-yellow-400 text-gray-900 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-xl"
          aria-label="Next quote"
        >
          →
        </button>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce {
          animation: bounce 2s infinite;
        }
      `}</style>
    </section>
  );
};

export default QuoteCarousel;
