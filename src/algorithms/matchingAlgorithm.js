/**
 * matchingAlgorithm.js — Algorithm Stubs
 *
 * IMPORTANT: These are placeholder implementations.
 * The real scoring/compatibility logic should be implemented here
 * without changing the function signatures.
 * Services import and call these; they never implement the logic themselves.
 */

/**
 * Determine if a blood unit type is compatible with a request type.
 * @param {string} unitType - e.g. "O-"
 * @param {string} requestType - e.g. "A+"
 * @returns {boolean}
 */
function isCompatible(unitType, requestType) {
  // Stub: accept all types. Replace with real compatibility matrix.
  const compatibilityMap = {
    'O-':  ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    'O+':  ['A+', 'B+', 'O+', 'AB+'],
    'A-':  ['A+', 'A-', 'AB+', 'AB-'],
    'A+':  ['A+', 'AB+'],
    'B-':  ['B+', 'B-', 'AB+', 'AB-'],
    'B+':  ['B+', 'AB+'],
    'AB-': ['AB+', 'AB-'],
    'AB+': ['AB+'],
  };
  const compatible = compatibilityMap[unitType] || [];
  return compatible.includes(requestType);
}

/**
 * Calculate a numeric score for how well a unit matches a request.
 * Higher score = better match.
 * @param {object} unit - BloodUnit document
 * @param {object} request - Request document
 * @returns {number}
 */
function calculateScore(unit, request) {
  // Stub: return 1 for all. Replace with distance + expiry + quantity scoring.
  let score = 1;

  // Prefer exact blood type match over universal donor
  if (unit.bloodType === request.bloodType) score += 10;

  // Prefer units expiring sooner (use first before they expire)
  const daysUntilExpiry = (new Date(unit.expiryDate) - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntilExpiry < 3) score += 5;   // critical — use first
  else if (daysUntilExpiry < 7) score += 3;

  return score;
}

/**
 * Rank an array of blood units for a given request, best match first.
 * @param {object[]} units - Array of BloodUnit documents
 * @param {object} request - Request document
 * @returns {object[]} - Sorted array, best match at index 0
 */
function rankUnits(units, request) {
  // Stub: sort by calculateScore descending
  return [...units].sort(
    (a, b) => calculateScore(b, request) - calculateScore(a, request)
  );
}

module.exports = { isCompatible, calculateScore, rankUnits };
