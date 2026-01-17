import React from 'react';

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-neutral-bg">
      {/* Navbar */}
      <nav className="bg-dark-green text-off-white p-4 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">CarbonMeter</h1>
          <ul className="flex gap-6">
            <li><a href="/dashboard" className="hover:text-gold">Dashboard</a></li>
            <li><a href="/log-activity" className="hover:text-gold">Log Activity</a></li>
            <li><a href="/community" className="hover:text-gold">Community</a></li>
            <li><a href="/carbon-map" className="hover:text-gold">Carbon Map</a></li>
            <li><a href="/tips" className="hover:text-gold">Tips</a></li>
          </ul>
          <div className="flex gap-4">
            <select className="px-2 py-1 bg-dark-green text-off-white border border-off-white rounded">
              <option>English</option>
            </select>
            <button className="px-4 py-1 bg-light-green text-dark-green rounded">Logout</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-dark-green to-light-green text-off-white p-8 text-center">
        <h2 className="text-4xl font-bold mb-4">
          "Every ton of carbon saved is a step toward a sustainable future."
        </h2>
        <p className="text-xl">Join thousands of climate-conscious individuals making a difference</p>
      </div>

      {/* Dashboard Stats */}
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Carbon Footprint */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-semibold">Total Carbon Footprint</h3>
            <p className="text-3xl font-bold text-dark-green mt-2">12.5 tons</p>
            <p className="text-xs text-gray-500 mt-1">This year</p>
          </div>

          {/* Carbon Saved */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-semibold">Carbon Saved</h3>
            <p className="text-3xl font-bold text-light-green mt-2">3.2 tons</p>
            <p className="text-xs text-gray-500 mt-1">This year</p>
          </div>

          {/* Monthly Goal */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-semibold">Monthly Emission Goal</h3>
            <p className="text-3xl font-bold text-brown mt-2">0.8 tons</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div
                className="bg-gold h-2 rounded-full"
                style={{ width: '65%' }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">65% used</p>
          </div>

          {/* Community Impact */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-semibold">Community Saved</h3>
            <p className="text-3xl font-bold text-light-blue mt-2">245 tons</p>
            <p className="text-xs text-gray-500 mt-1">Global community</p>
          </div>
        </div>

        {/* Badges Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-dark-green mb-4">Your Badges</h3>
          <div className="flex gap-4 flex-wrap">
            <div className="text-center">
              <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-2">
                🏆
              </div>
              <p className="text-sm font-semibold">Eco Hero</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-light-green rounded-full flex items-center justify-center mx-auto mb-2">
                ♻️
              </div>
              <p className="text-sm font-semibold">Green Warrior</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
