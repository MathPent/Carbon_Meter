import React, { useState } from 'react';

const VisualStorytelling = () => {
  const [hoveredImage, setHoveredImage] = useState(null);

  const images = [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800',
      title: 'Industrial Emissions',
      description: 'Manufacturing and industrial processes'
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
      title: 'Traffic Congestion',
      description: 'Urban transportation emissions'
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
      title: 'Renewable Energy',
      description: 'Clean energy solutions'
    },
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800',
      title: 'Earth from Space',
      description: 'Our shared home'
    }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-green-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            📸 Visual Impact
          </h2>
          <p className="text-gray-300 text-lg">
            Seeing the sources and solutions of carbon emissions
          </p>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group overflow-hidden rounded-2xl aspect-video bg-gray-800 border border-yellow-500/20 hover:border-yellow-500/60 transition-all duration-500"
              onMouseEnter={() => setHoveredImage(image.id)}
              onMouseLeave={() => setHoveredImage(null)}
              style={{
                animation: `fadeIn 0.8s ease-out ${index * 0.2}s both`
              }}
            >
              {/* Image */}
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500"></div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className={`transform transition-all duration-500 ${hoveredImage === image.id ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                  <h3 className="text-white font-bold text-2xl mb-2">
                    {image.title}
                  </h3>
                  <p className="text-yellow-400 text-lg">
                    {image.description}
                  </p>
                </div>

                {/* Bottom accent */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-yellow-500 transform origin-left transition-transform duration-500 ${hoveredImage === image.id ? 'scale-x-100' : 'scale-x-0'}`}></div>
              </div>

              {/* Icon indicator */}
              <div className="absolute top-4 right-4 bg-yellow-500 text-gray-900 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                🔍
              </div>
            </div>
          ))}
        </div>

        {/* Caption */}
        <div className="bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-lg rounded-2xl p-8 border border-yellow-500/30 text-center">
          <p className="text-white text-lg md:text-xl leading-relaxed">
            <span className="text-yellow-400 font-bold">Energy, transport and industry</span>{' '}
            together form the largest sources of global emissions. Transitioning to renewable
            energy and sustainable practices is essential for our planet's future.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </section>
  );
};

export default VisualStorytelling;
