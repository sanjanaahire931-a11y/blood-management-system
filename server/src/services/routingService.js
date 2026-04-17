/**
 * routingService.js
 * Returns route information between two coordinates.
 * Currently using mock mode (Option B). Swap for Google Maps API when ready.
 */

const { planDelivery } = require('../../logistics_engine');

/**
 * Get routing information from one location to another.
 * @param {object} fromLocation - { lat, lng }
 * @param {object} toLocation   - { lat, lng }
 * @param {string} urgencyLevel - e.g., 'high', 'medium', 'low'
 * @returns {object} { distance, eta, path, deliveryMode }
 */
async function getRoute(fromLocation, toLocation, urgencyLevel = 'medium') {
  const distanceKm = haversineDistanceKm(fromLocation, toLocation);
  
  // Use logistics engine to plan mode & exact ETA
  const plan = planDelivery({
    source: `${fromLocation.lat},${fromLocation.lng}`,
    destination: `${toLocation.lat},${toLocation.lng}`,
    distance: distanceKm,
    urgencyLevel: urgencyLevel,
    emergency: urgencyLevel === 'high'
  });

  return {
    distance: `${distanceKm.toFixed(1)} km`,
    eta: `${plan.etaMinutes} mins`,
    path: plan.selectedRoute,
    deliveryMode: plan.deliveryMode
  };
}

/**
 * Haversine formula — distance between two lat/lng points in km.
 */
function haversineDistanceKm(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

module.exports = { getRoute };
