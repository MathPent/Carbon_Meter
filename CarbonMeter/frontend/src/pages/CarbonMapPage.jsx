import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import api from '../api';
import 'leaflet/dist/leaflet.css';
import './CarbonMapPage.css';

// Component to recenter map when location changes
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

const CarbonMapPage = () => {
  // State
  const [mapData, setMapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationRequested, setLocationRequested] = useState(false);
  const [demoZones, setDemoZones] = useState([]);
  
  // Filters
  const [categoryFilters, setCategoryFilters] = useState({
    Transport: true,
    Electricity: true,
    Food: true,
    Waste: true
  });
  const [timeFilter, setTimeFilter] = useState(7); // days
  
  // Summary
  const [summary, setSummary] = useState({
    totalEmissions: 0,
    highestCategory: '',
    activeLocations: 0
  });

  // Default map center (India)
  const defaultCenter = [20.5937, 78.9629];
  const mapCenter = userLocation || defaultCenter;

  // Request user location once on mount
  useEffect(() => {
    requestUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch map data when filters change
  useEffect(() => {
    fetchMapData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter]);

  // Update summary when data or filters change
  useEffect(() => {
    calculateSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapData, categoryFilters, demoZones]);

  // Regenerate demo zones when time filter changes
  useEffect(() => {
    if (userLocation) {
      generateDemoZones(userLocation[0], userLocation[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter]);

  const requestUserLocation = () => {
    if (locationRequested) return;
    setLocationRequested(true);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        setUserLocation([latitude, longitude]);
        setLocationAccuracy(accuracy);
        
        // Cache location
        localStorage.setItem('lastLocation', JSON.stringify([latitude, longitude]));
        localStorage.setItem('lastAccuracy', accuracy);
        
        // Generate demo emission zones around user location
        generateDemoZones(latitude, longitude);
        
        // Improved accuracy messaging
        if (accuracy > 200) {
          setLocationError(`GPS accuracy: ${Math.round(accuracy)}m. Location is approximate. Try moving outdoors for better accuracy.`);
        } else if (accuracy > 50) {
          setLocationError(`GPS accuracy: ${Math.round(accuracy)}m. Location is fairly accurate.`);
        } else {
          setLocationError(null); // Good accuracy (< 50m)
        }
      },
      (err) => {
        const cached = localStorage.getItem('lastLocation');
        if (cached) {
          const cachedLoc = JSON.parse(cached);
          setUserLocation(cachedLoc);
          setLocationAccuracy(parseFloat(localStorage.getItem('lastAccuracy')) || 0);
          generateDemoZones(cachedLoc[0], cachedLoc[1]);
          setLocationError('Location permission denied. Using last known location.');
        } else {
          setLocationError('Location access denied. Showing India map.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // Increased to 20 seconds for better GPS fix
        maximumAge: 0 // Don't use cached position
      }
    );
  };

  const generateDemoZones = (userLat, userLng) => {
    const timeMultiplier = timeFilter === 7 ? 0.8 : timeFilter === 30 ? 1.0 : 1.2;
    
    const zones = [
      {
        id: 'zone1',
        name: "Urban Commercial Zone",
        category: "Transport",
        lat: userLat + 0.02,
        lng: userLng + 0.03,
        baseEmission: 6.5,
        description: "High traffic commercial area"
      },
      {
        id: 'zone2',
        name: "Industrial Area",
        category: "Electricity",
        lat: userLat - 0.03,
        lng: userLng - 0.01,
        baseEmission: 9.2,
        description: "Manufacturing and industrial facilities"
      },
      {
        id: 'zone3',
        name: "Residential Neighborhood",
        category: "Food",
        lat: userLat + 0.01,
        lng: userLng - 0.02,
        baseEmission: 3.1,
        description: "Dense residential area with food outlets"
      },
      {
        id: 'zone4',
        name: "Transport Hub",
        category: "Transport",
        lat: userLat - 0.015,
        lng: userLng + 0.025,
        baseEmission: 7.8,
        description: "Bus terminal and railway station"
      },
      {
        id: 'zone5',
        name: "Waste Management Zone",
        category: "Waste",
        lat: userLat + 0.025,
        lng: userLng - 0.015,
        baseEmission: 5.4,
        description: "Waste processing and recycling center"
      },
      {
        id: 'zone6',
        name: "IT Park",
        category: "Electricity",
        lat: userLat - 0.01,
        lng: userLng + 0.01,
        baseEmission: 4.2,
        description: "Office buildings with high power usage"
      },
      {
        id: 'zone7',
        name: "Market District",
        category: "Food",
        lat: userLat + 0.03,
        lng: userLng + 0.01,
        baseEmission: 3.8,
        description: "Fresh produce and retail market"
      },
      {
        id: 'zone8',
        name: "Highway Junction",
        category: "Transport",
        lat: userLat - 0.025,
        lng: userLng - 0.03,
        baseEmission: 8.5,
        description: "Major highway intersection"
      }
    ];

    const adjustedZones = zones.map(zone => ({
      ...zone,
      emission: parseFloat((zone.baseEmission * timeMultiplier).toFixed(2))
    }));

    setDemoZones(adjustedZones);
  };

  const handleRetryLocation = () => {
    setLocationRequested(false);
    setLocationError(null);
    setUserLocation(null);
    setDemoZones([]);
    requestUserLocation();
  };

  const fetchMapData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/map/individual?days=${timeFilter}`);
      
      if (response.data.success) {
        setMapData(response.data.data || []);
      } else {
        setMapData([]);
      }
    } catch (err) {
      console.error('Error fetching map data:', err);
      setError('Unable to load map data. Please try again.');
      setMapData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    const filteredData = mapData.filter(item => categoryFilters[item.category]);
    const filteredZones = demoZones.filter(zone => categoryFilters[zone.category]);
    
    const userDataTotal = filteredData.reduce((sum, item) => sum + (item.emission || 0), 0);
    const zoneDataTotal = filteredZones.reduce((sum, zone) => sum + (zone.emission || 0), 0);
    const total = userDataTotal + zoneDataTotal;
    
    // Find highest category
    const categoryTotals = {};
    filteredData.forEach(item => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.emission;
    });
    filteredZones.forEach(zone => {
      categoryTotals[zone.category] = (categoryTotals[zone.category] || 0) + zone.emission;
    });
    
    let highest = '';
    let highestValue = 0;
    Object.keys(categoryTotals).forEach(cat => {
      if (categoryTotals[cat] > highestValue) {
        highestValue = categoryTotals[cat];
        highest = cat;
      }
    });

    setSummary({
      totalEmissions: total.toFixed(2),
      highestCategory: highest || 'N/A',
      activeLocations: filteredData.length + filteredZones.length
    });
  };

  const getMarkerColor = (emission) => {
    if (emission <= 2) return '#4ade80'; // Green
    if (emission <= 4) return '#facc15'; // Yellow
    if (emission <= 7) return '#fb923c'; // Orange
    return '#ef4444'; // Red
  };

  const getEmissionLevel = (emission) => {
    if (emission <= 2) return 'Low';
    if (emission <= 4) return 'Moderate';
    if (emission <= 7) return 'High';
    return 'Critical';
  };

  const getZoneRadius = (emission) => {
    // Base radius proportional to emission level
    return Math.max(15, Math.min(35, emission * 3));
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Transport: '🚗',
      Electricity: '⚡',
      Food: '🍽️',
      Waste: '♻️'
    };
    return icons[category] || '📍';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const toggleCategory = (category) => {
    setCategoryFilters(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const filteredMapData = mapData.filter(item => categoryFilters[item.category]);
  const filteredDemoZones = demoZones.filter(zone => categoryFilters[zone.category]);

  return (
    <div className="carbon-map-page">
      <div className="map-header">
        <h1>🗺️ Carbon Emission Map</h1>
        <p>Visualize where your emissions are generated</p>
      </div>

      {locationError && (
        <div className="location-warning">
          <span>⚠️ {locationError}</span>
          <button onClick={handleRetryLocation} className="retry-btn">Retry Location</button>
        </div>
      )}

      <div className="map-container-wrapper">
        {/* Left Panel - Filters */}
        <div className="map-sidebar">
          <div className="filter-section">
            <h3>📊 Categories</h3>
            <div className="category-filters">
              {Object.keys(categoryFilters).map(category => (
                <label key={category} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={categoryFilters[category]}
                    onChange={() => toggleCategory(category)}
                  />
                  <span className="checkbox-label">
                    {getCategoryIcon(category)} {category}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>📅 Time Range</h3>
            <div className="time-filters">
              <button
                className={`time-btn ${timeFilter === 7 ? 'active' : ''}`}
                onClick={() => setTimeFilter(7)}
              >
                Last 7 Days
              </button>
              <button
                className={`time-btn ${timeFilter === 30 ? 'active' : ''}`}
                onClick={() => setTimeFilter(30)}
              >
                Last 30 Days
              </button>
              <button
                className={`time-btn ${timeFilter === 365 ? 'active' : ''}`}
                onClick={() => setTimeFilter(365)}
              >
                Last Year
              </button>
            </div>
          </div>

          <div className="filter-section">
            <h3>🎨 Legend</h3>
            <div className="legend">
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#4ade80' }}></div>
                <span>Low (≤2 tCO₂e/yr)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#facc15' }}></div>
                <span>Moderate (2-4)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#fb923c' }}></div>
                <span>High (4-7)</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ background: '#ef4444' }}></div>
                <span>Critical (&gt;7)</span>
              </div>
              <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
                  ℹ️ Emission zones are indicative for demonstration purposes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="map-content">
          {loading ? (
            <div className="map-loading">
              <div className="spinner"></div>
              <p>Loading map data...</p>
            </div>
          ) : error ? (
            <div className="map-error">
              <span>❌</span>
              <p>{error}</p>
              <button onClick={fetchMapData} className="retry-btn">Retry</button>
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={userLocation ? 13 : 5}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <MapController center={userLocation} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {/* User location marker */}
              {userLocation && (
                <CircleMarker
                  center={userLocation}
                  radius={10}
                  pathOptions={{
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.6,
                    weight: 3,
                    className: 'pulse-marker'
                  }}
                >
                  <Popup>
                    <div className="popup-content">
                      <h4>📍 You are here</h4>
                      <div className="popup-details">
                        <p><strong>Your Current Location</strong></p>
                        {locationAccuracy && (
                          <>
                            <p><strong>Accuracy:</strong> {Math.round(locationAccuracy)} meters</p>
                            {locationAccuracy <= 50 && (
                              <p style={{ color: '#10b981', fontSize: '12px' }}>✓ High accuracy GPS</p>
                            )}
                            {locationAccuracy > 50 && locationAccuracy <= 200 && (
                              <p style={{ color: '#fbbf24', fontSize: '12px' }}>⚠️ Moderate accuracy</p>
                            )}
                            {locationAccuracy > 200 && (
                              <p style={{ color: '#ef4444', fontSize: '12px' }}>⚠️ Low accuracy - try outdoors</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              )}

              {/* Demo emission zones */}
              {filteredDemoZones.map((zone) => (
                <CircleMarker
                  key={zone.id}
                  center={[zone.lat, zone.lng]}
                  radius={getZoneRadius(zone.emission)}
                  pathOptions={{
                    color: getMarkerColor(zone.emission),
                    fillColor: getMarkerColor(zone.emission),
                    fillOpacity: 0.4,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="popup-content">
                      <h4>{getCategoryIcon(zone.category)} {zone.name}</h4>
                      <div className="popup-details">
                        <p><strong>Category:</strong> {zone.category}</p>
                        <p><strong>Emission:</strong> {zone.emission} tCO₂e/year</p>
                        <p><strong>Level:</strong> {getEmissionLevel(zone.emission)}</p>
                        <p><strong>Description:</strong> {zone.description}</p>
                        <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '8px', fontStyle: 'italic' }}>
                          📊 Data shown for demonstration
                        </p>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* User's actual logged activities */}
              {filteredMapData.map((item, index) => (
                item.latitude && item.longitude && (
                  <CircleMarker
                    key={index}
                    center={[item.latitude, item.longitude]}
                    radius={10}
                    pathOptions={{
                      color: getMarkerColor(item.emission),
                      fillColor: getMarkerColor(item.emission),
                      fillOpacity: 0.7,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="popup-content">
                        <h4>{getCategoryIcon(item.category)} {item.category}</h4>
                        <div className="popup-details">
                          <p><strong>Emission:</strong> {item.emission.toFixed(2)} kg CO₂</p>
                          <p><strong>Level:</strong> {getEmissionLevel(item.emission)}</p>
                          <p><strong>Date:</strong> {formatDate(item.date)}</p>
                          <p><strong>Source:</strong> {item.source || 'Manual'}</p>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              ))}
            </MapContainer>
          )}
        </div>
      </div>

      {/* Summary Panel */}
      <div className="map-summary">
        <div className="summary-card">
          <div className="summary-icon">🌍</div>
          <div className="summary-details">
            <span className="summary-label">Total Emissions</span>
            <span className="summary-value">{summary.totalEmissions} kg CO₂</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">🔥</div>
          <div className="summary-details">
            <span className="summary-label">Highest Category</span>
            <span className="summary-value">{summary.highestCategory}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📍</div>
          <div className="summary-details">
            <span className="summary-label">Active Locations</span>
            <span className="summary-value">{summary.activeLocations}</span>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="privacy-notice">
        <span>🔒</span>
        <p>Your exact location is real-time GPS data. Nearby emission zones are currently indicative to demonstrate regional carbon intensity. This system is designed to integrate with real city-level emission datasets.</p>
      </div>
    </div>
  );
};

export default CarbonMapPage;
