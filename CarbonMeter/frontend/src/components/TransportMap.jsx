import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateDistance } from '../utils/haversine';
import './TransportMap.css';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons for start and destination
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Component to recenter map when location changes
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

const TransportMap = ({ startLocation, onDestinationSelect, destination }) => {
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    if (startLocation && destination) {
      const dist = calculateDistance(
        startLocation.lat,
        startLocation.lng,
        destination.lat,
        destination.lng
      );
      setDistance(dist);
    } else {
      setDistance(0);
    }
  }, [startLocation, destination]);

  const handleMapClick = (latlng) => {
    onDestinationSelect({
      lat: latlng.lat,
      lng: latlng.lng
    });
  };

  if (!startLocation) {
    return (
      <div className="map-placeholder">
        <p>📍 Please set your start location first</p>
      </div>
    );
  }

  return (
    <div className="transport-map-container">
      <MapContainer
        center={[startLocation.lat, startLocation.lng]}
        zoom={13}
        style={{ height: '400px', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapRecenter center={[startLocation.lat, startLocation.lng]} />
        <MapClickHandler onMapClick={handleMapClick} />

        {/* Start marker */}
        <Marker 
          position={[startLocation.lat, startLocation.lng]} 
          icon={startIcon}
        />

        {/* Destination marker */}
        {destination && (
          <>
            <Marker 
              position={[destination.lat, destination.lng]} 
              icon={destinationIcon}
            />
            
            {/* Polyline connecting start and destination */}
            <Polyline
              positions={[
                [startLocation.lat, startLocation.lng],
                [destination.lat, destination.lng]
              ]}
              color="#FACC15"
              weight={3}
              opacity={0.7}
            />
          </>
        )}
      </MapContainer>

      {/* Distance display */}
      {distance > 0 && (
        <div className="map-distance-display">
          <div className="distance-info">
            <span className="distance-icon">📏</span>
            <div>
              <div className="distance-label">Distance</div>
              <div className="distance-value">{distance} km</div>
            </div>
          </div>
        </div>
      )}

      <div className="map-instructions">
        <p>
          <span className="marker-indicator green">●</span> Green marker = Start location
        </p>
        <p>
          <span className="marker-indicator red">●</span> Red marker = Destination (click on map to set)
        </p>
      </div>
    </div>
  );
};

export default TransportMap;
