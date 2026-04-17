/**
 * donorService.js
 * Finds eligible nearby donors for emergency blood requests.
 */

const Donor = require('../models/Donor');

const SEARCH_RADIUS_KM = 10;
const MAX_DONORS = 5;

/**
 * Find eligible donors near the request location.
 * Includes universal donors (O-) regardless of blood type match.
 * @param {object} request - { bloodType, location: { lat, lng } }
 * @returns {object[]} Up to 5 closest eligible donors
 */
async function findDonors(request) {
  const { bloodType, location } = request;

  // Query eligible donors of matching type or universal donor O-
  const candidates = await Donor.find({
    isEligible: true,
    bloodType: { $in: [bloodType, 'O-'] },
  });

  // Filter by haversine distance <= 10 km and attach distance info
  const nearby = candidates
    .map((donor) => {
      const dist = haversineDistanceKm(donor.location, location);
      return { donor, distanceKm: dist };
    })
    .filter(({ distanceKm }) => distanceKm <= SEARCH_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, MAX_DONORS);

  return nearby.map(({ donor, distanceKm }) => ({
    ...donor.toObject(),
    distanceKm: parseFloat(distanceKm.toFixed(2)),
  }));
}

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

module.exports = { findDonors };
