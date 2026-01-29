import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import api from '../api';
import 'leaflet/dist/leaflet.css';
import './CarbonMapPage.css';

// Component to smoothly recenter map (Google Maps-like behavior)
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      // Use flyTo for smooth animation instead of instant setView
      map.flyTo(center, 13, {
        animate: true,
        duration: 1.5 // Smooth 1.5 second animation
      });
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
  const [locationLocked, setLocationLocked] = useState(false); // Prevent location jitter
  const [locationStatus, setLocationStatus] = useState('detecting'); // detecting, locked, approximate, failed
  const [demoZones, setDemoZones] = useState([]);
  
  // Refs for coordinate smoothing (Google Maps-like stabilization)
  const prevCoordsRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
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

  // 🎯 Coordinate Smoothing (Google Maps-like stabilization)
  const smoothCoordinates = (newLat, newLng) => {
    if (!prevCoordsRef.current) {
      prevCoordsRef.current = { lat: newLat, lng: newLng };
      return [newLat, newLng];
    }

    // Apply weighted smoothing: 70% previous + 30% new
    const smoothedLat = (prevCoordsRef.current.lat * 0.7) + (newLat * 0.3);
    const smoothedLng = (prevCoordsRef.current.lng * 0.7) + (newLng * 0.3);
    
    prevCoordsRef.current = { lat: smoothedLat, lng: smoothedLng };
    return [smoothedLat, smoothedLng];
  };

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
    setLocationStatus('detecting');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationStatus('failed');
      return;
    }

    // ✅ Use getCurrentPosition (NOT watchPosition) - single-shot location for map centering
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        console.log('📍 Browser location received:', {
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
          accuracy: Math.round(accuracy) + 'm'
        });

        // 🎯 Apply coordinate smoothing for stability
        const [smoothedLat, smoothedLng] = smoothCoordinates(latitude, longitude);

        // 🔒 LOCK LOCATION (never update automatically)
        setUserLocation([smoothedLat, smoothedLng]);
        setLocationAccuracy(accuracy);
        setLocationLocked(true);
        
        // Cache location for session
        localStorage.setItem('lastLocation', JSON.stringify([smoothedLat, smoothedLng]));
        localStorage.setItem('lastAccuracy', accuracy);
        
        // Generate demo emission zones around user location
        generateDemoZones(smoothedLat, smoothedLng);
        
        // 👍 POSITIVE MESSAGING (Google Maps-like UX)
        if (accuracy <= 100) {
          setLocationError(null);
          setLocationStatus('locked');
          console.log('✅ High accuracy location locked:', Math.round(accuracy) + 'm');
        } else if (accuracy <= 1000) {
          setLocationError('Showing your approximate location (desktop browser mode).');
          setLocationStatus('approximate');
          console.log('🖥️ Approximate location stabilized:', Math.round(accuracy) + 'm');
        } else {
          // Accept even very poor accuracy but inform user
          setLocationError(`Showing approximate area location (±${Math.round(accuracy/1000)}km). For exact GPS, use mobile devices.`);
          setLocationStatus('approximate');
          console.log('🖥️ Area-level positioning:', Math.round(accuracy/1000) + 'km');
        }
      },
      (err) => {
        console.error('❌ Location error:', err);
        
        // Try cached location first
        const cached = localStorage.getItem('lastLocation');
        if (cached) {
          const cachedLoc = JSON.parse(cached);
          setUserLocation(cachedLoc);
          setLocationAccuracy(parseFloat(localStorage.getItem('lastAccuracy')) || 500);
          setLocationLocked(true);
          generateDemoZones(cachedLoc[0], cachedLoc[1]);
          setLocationError('Using last known location.');
          setLocationStatus('approximate');
        } else {
          // Fallback to demo city
          applyFallbackLocation();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // 20 seconds for GPS fix
        maximumAge: 60000 // Accept cached position up to 1 minute old
      }
    );
  };

  // 🏙️ GRACEFUL FALLBACK - Default to major city
  const applyFallbackLocation = () => {
    // Default to Lucknow (or your demo city)
    const fallbackLocation = [26.8467, 80.9462]; // Lucknow, India
    setUserLocation(fallbackLocation);
    setLocationAccuracy(1000);
    setLocationLocked(true);
    generateDemoZones(fallbackLocation[0], fallbackLocation[1]);
    setLocationError('Location unavailable. Showing city-level emissions.');
    setLocationStatus('failed');
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
    setLocationLocked(false);
    setLocationError(null);
    setUserLocation(null);
    setLocationStatus('detecting');
    setDemoZones([]);
    prevCoordsRef.current = null; // Reset smoothing
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

      {/* Location Status Banner - Informational, not error */}
      {locationStatus === 'detecting' && (
        <div className="location-info info-blue">
          <span>📍 Detecting your location...</span>
        </div>
      )}
      
      {locationStatus === 'locked' && !locationError && (
        <div className="location-info info-green">
          <span>✅ High accuracy location locked ({Math.round(locationAccuracy)}m)</span>
        </div>
      )}
      
      {locationStatus === 'approximate' && locationError && (
        <div className="location-info info-yellow">
          <span>📍 {locationError}</span>
          <button onClick={handleRetryLocation} className="retry-btn">Recenter</button>
        </div>
      )}
      
      {locationStatus === 'failed' && locationError && (
        <div className="location-info info-orange">
          <span>ℹ️ {locationError}</span>
          <button onClick={handleRetryLocation} className="retry-btn">Retry Location</button>
        </div>
      )}

      <div className="map-container-wrapper">
        {/* Left Panel - Filters */}
        <div className="map-sidebar">
          <div className="filter-section">
            <h3>� Location Control</h3>
            <button onClick={handleRetryLocation} className="recenter-btn">
              📍 Recenter to My Location
            </button>
            {locationLocked && (
              <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                <p style={{ fontSize: '11px', color: '#10b981', margin: 0, lineHeight: '1.4' }}>
                  🔒 Location locked - no jitter
                </p>
              </div>
            )}
          </div>

          <div className="filter-section">
            <h3>�📊 Categories</h3>
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

              {/* User location marker with confidence radius */}
              {userLocation && (
                <>
                  {/* 🟢 CONFIDENCE RADIUS CIRCLE */}
                  {locationAccuracy && locationAccuracy > 50 && (
                    <Circle
                      center={userLocation}
                      radius={locationAccuracy}
                      pathOptions={{
                        color: locationAccuracy > 200 ? '#fbbf24' : '#3b82f6',
                        fillColor: locationAccuracy > 200 ? '#fbbf24' : '#3b82f6',
                        fillOpacity: 0.1,
                        weight: 2,
                        dashArray: '5, 10'
                      }}
                    />
                  )}
                  
                  {/* 📍 FIXED "YOU ARE HERE" MARKER */}
                  <CircleMarker
                    center={userLocation}
                    radius={12}
                    pathOptions={{
                      color: '#10b981',
                      fillColor: '#10b981',
                      fillOpacity: 0.8,
                      weight: 4,
                      className: 'pulse-marker'
                    }}
                  >
                    <Popup>
                      <div className="popup-content">
                        <h4>📍 You are here (approximate)</h4>
                        <div className="popup-details">
                          <p><strong>Latitude:</strong> {userLocation[0].toFixed(6)}</p>
                          <p><strong>Longitude:</strong> {userLocation[1].toFixed(6)}</p>
                          {locationAccuracy && (
                            <>
                              <p><strong>Accuracy:</strong> ~{Math.round(locationAccuracy)}m</p>
                              {locationAccuracy <= 100 && (
                                <p style={{ color: '#10b981', fontSize: '12px', marginTop: '6px' }}>
                                  ✅ <strong>High precision</strong>
                                </p>
                              )}
                              {locationAccuracy > 100 && locationAccuracy <= 1000 && (
                                <p style={{ color: '#fbbf24', fontSize: '12px', marginTop: '6px' }}>
                                  📍 <strong>Approximate location (desktop browser mode)</strong><br/>
                                  <span style={{ fontSize: '11px' }}>For exact GPS, mobile devices provide higher accuracy</span>
                                </p>
                              )}
                              {locationAccuracy > 1000 && (
                                <p style={{ color: '#fb923c', fontSize: '12px', marginTop: '6px' }}>
                                  📍 <strong>Area-level positioning</strong><br/>
                                  <span style={{ fontSize: '11px' }}>Desktop browsers use Wi-Fi/IP-based location</span>
                                </p>
                              )}
                            </>
                          )}
                          <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                            🔒 Stabilized location - similar to Google Maps web
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                </>
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

      {/* Demo Information Notice */}
      <div className="privacy-notice">
        <span>🎯</span>
        <p><strong>For Demo/Judges:</strong> On desktop browsers, CarbonMeter intelligently switches to approximate geolocation (Wi-Fi/cell tower based) while maintaining accurate emission visualization. Your location pin is locked to prevent drift. Emission zones are semi-realistic for demonstration purposes and designed to integrate with real city-level carbon datasets.</p>
      </div>
    </div>
  );
};

export default CarbonMapPage;
