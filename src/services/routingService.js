/**
 * routingService.js
 * Returns route information between two coordinates.
 * Currently using mock mode (Option B). Swap for Google Maps API when ready.
 */

/**
 * Get routing information from one location to another.
 * @param {object} fromLocation - { lat, lng }
 * @param {object} toLocation   - { lat, lng }
 * @returns {object} { distance, eta, path }
 */
async function getRoute(fromLocation, toLocation) {
  // Option B: Mock response
  // To enable Google Maps: set GOOGLE_MAPS_API_KEY in .env and
  // call https://maps.googleapis.com/maps/api/distancematrix/json
  const distanceKm = haversineDistanceKm(fromLocation, toLocation).toFixed(1);
  const etaMinutes = Math.round(distanceKm / 0.4); // ~24 km/h city speed estimate

  return {
    distance: `${distanceKm} km`,
    eta: `${etaMinutes} mins`,
    path: [fromLocation, toLocation],
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
