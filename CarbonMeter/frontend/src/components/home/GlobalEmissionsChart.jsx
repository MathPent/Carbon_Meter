import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const GlobalEmissionsChart = () => {
  const data = [
    { name: 'Energy (Electricity & Heat)', value: 34, color: '#F59E0B' },
    { name: 'Industry (Manufacturing)', value: 21, color: '#FBBF24' },
    { name: 'Agriculture & Land Use', value: 18, color: '#FCD34D' },
    { name: 'Transport', value: 15, color: '#FDE68A' },
    { name: 'Buildings', value: 6, color: '#FEF3C7' },
    { name: 'Waste', value: 6, color: '#FFFBEB' }
  ];

  const [activeIndex, setActiveIndex] = useState(null);

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border-2 border-yellow-500 p-3 rounded-lg shadow-xl">
          <p className="text-white font-semibold">{payload[0].name}</p>
          <p className="text-yellow-400 text-xl font-bold">{payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-green-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-fadeIn">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Global Greenhouse Gas Emissions by Sector
          </h2>
          <p className="text-gray-300 text-lg">
            Understanding where emissions come from is the first step to reducing them
          </p>
        </div>

        <div className="bg-gray-900/40 backdrop-blur-lg rounded-3xl p-8 border border-yellow-500/20 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                        stroke={activeIndex === index ? '#fff' : 'none'}
                        strokeWidth={activeIndex === index ? 3 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              {data.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-white font-medium">{item.name}</span>
                  </div>
                  <span className="text-yellow-400 font-bold text-xl">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-8 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              Source: <span className="text-yellow-400">IPCC AR6 / Our World in Data</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobalEmissionsChart;
