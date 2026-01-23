import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import GovNavbar from '../../components/gov/GovNavbar';
import './GovCarbonMap.css';

const GovCarbonMap = () => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchMapData();
  }, [filter]);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/gov/carbon-map?filter=${filter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMapData(response.data);
    } catch (error) {
      console.error('Error fetching map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmissionLevel = (emission) => {
    if (emission < 100) return 'low';
    if (emission < 500) return 'medium';
    return 'high';
  };

  if (loading) {
    return (
      <>
        <GovNavbar />
        <div className="gov-loading">
          <div className="gov-spinner"></div>
          <p>Loading Carbon Map...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <GovNavbar />
      <div className="gov-carbon-map">
        {/* Header */}
        <div className="map-header">
          <div>
            <h1>Government Carbon Map</h1>
            <p>Visualize emission hotspots across departments</p>
          </div>
          <div className="org-filter">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Organizations</option>
              <option value="Government Transport">Government Transport</option>
              <option value="Buildings & Offices">Buildings & Offices</option>
              <option value="Health Infrastructure">Health Infrastructure</option>
              <option value="Municipal Services">Municipal Services</option>
              <option value="Education Institutions">Education Institutions</option>
              <option value="Industries & PSUs">Industries & PSUs</option>
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="map-legend">
          <h3>Emission Levels</h3>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-dot low"></span>
              <span>Low (&lt; 100 kg CO₂e)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot medium"></span>
              <span>Medium (100-500 kg CO₂e)</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot high"></span>
              <span>High (&gt; 500 kg CO₂e)</span>
            </div>
          </div>
        </div>

        {/* Map Container (Simplified View) */}
        <div className="map-container">
          {mapData.length > 0 ? (
            <div className="emission-points">
              {mapData.map((point, index) => (
                <div
                  key={index}
                  className={`emission-point ${getEmissionLevel(point.emission)}`}
                >
                  <div className="point-header">
                    <h3>{point.departmentName}</h3>
                    <span className={`emission-badge ${getEmissionLevel(point.emission)}`}>
                      {point.emission.toFixed(2)} kg CO₂e
                    </span>
                  </div>
                  <p className="org-type">{point.organizationType}</p>
                  <div className="point-details">
                    <div className="detail-item">
                      <span className="detail-label">Activities:</span>
                      <span className="detail-value">{point.activityCount}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Top Category:</span>
                      <span className="detail-value">{point.topCategory}</span>
                    </div>
                    {point.location && (
                      <div className="detail-item">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{point.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-map">
              <span>🗺️</span>
              <h3>No Emission Data Available</h3>
              <p>Map will populate as departments log location-based activities</p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="map-summary">
          <h3>📊 Summary Statistics</h3>
          <div className="summary-grid">
            <div className="summary-card">
              <span className="summary-icon">🏢</span>
              <div>
                <h4>Total Departments</h4>
                <p>{mapData.length}</p>
              </div>
            </div>
            <div className="summary-card">
              <span className="summary-icon">📍</span>
              <div>
                <h4>Emission Points</h4>
                <p>{mapData.reduce((acc, p) => acc + p.activityCount, 0)}</p>
              </div>
            </div>
            <div className="summary-card">
              <span className="summary-icon">⚠️</span>
              <div>
                <h4>High Emission Areas</h4>
                <p>{mapData.filter(p => getEmissionLevel(p.emission) === 'high').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GovCarbonMap;
