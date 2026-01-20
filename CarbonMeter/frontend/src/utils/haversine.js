/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * @param {number} lat1 - Start latitude in degrees
 * @param {number} lon1 - Start longitude in degrees
 * @param {number} lat2 - End latitude in degrees
 * @param {number} lon2 - End longitude in degrees
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Earth's radius in kilometers
  const R = 6371;

  // Convert degrees to radians
  const toRadians = (degrees) => degrees * (Math.PI / 180);

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Distance in kilometers
  const distance = R * c;

  return Number(distance.toFixed(2));
};

/**
 * Calculate carbon emission based on distance and vehicle data
 * @param {number} distance - Distance in kilometers
 * @param {object} vehicle - Vehicle object containing emission factors
 * @returns {object} Emission calculation details
 */
export const calculateEmission = (distance, vehicle) => {
  if (!vehicle || !distance) {
    return {
      co2: 0,
      method: 'invalid',
      details: 'Missing vehicle or distance data'
    };
  }

  // Preferred method: Direct CO2 per km
  if (vehicle.co2_per_km) {
    const co2 = Number((distance * vehicle.co2_per_km).toFixed(3));
    return {
      co2,
      method: 'direct',
      details: `${distance} km × ${vehicle.co2_per_km} kg/km = ${co2} kg CO₂`
    };
  }

  // Fallback method: Calculate from mileage and CO2 factor
  if (vehicle.mileage && vehicle.co2_factor) {
    const fuelUsed = distance / vehicle.mileage;
    const co2 = Number((fuelUsed * vehicle.co2_factor).toFixed(3));
    return {
      co2,
      method: 'calculated',
      details: `Fuel used: ${fuelUsed.toFixed(2)} ${vehicle.mileage_unit.replace('km', '')} | CO₂: ${co2} kg`
    };
  }

  return {
    co2: 0,
    method: 'error',
    details: 'Insufficient vehicle data for calculation'
  };
};
