/**
 * matchingService.js
 * Finds the best available blood unit for a request.
 * Delegates all scoring logic to algorithms/matchingAlgorithm.js
 */

const BloodUnit = require('../models/BloodUnit');
const { isCompatible, rankUnits } = require('../algorithms/matchingAlgorithm');

/**
 * Find the best matching blood unit for a given request.
 * @param {object} request - Request document (has .bloodType, .location)
 * @returns {object|null} Best matching BloodUnit, or null if none found.
 */
async function findBestUnit(request) {
  // Fetch all AVAILABLE units (pre-hook filters expired)
  const units = await BloodUnit.find({ status: 'AVAILABLE' });

  // Filter by blood compatibility using algorithm
  const compatibleUnits = units.filter((unit) =>
    isCompatible(unit.bloodType, request.bloodType)
  );

  if (compatibleUnits.length === 0) return null;

  // Let the algorithm rank them
  const ranked = rankUnits(compatibleUnits, request);

  return ranked[0] || null;
}

module.exports = { findBestUnit };
