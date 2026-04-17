// blood_matching_engine.js
/**
 * Blood Matching Engine
 * --------------------
 * Provides functions to determine compatible blood units for a patient and rank them
 * based on distance, expiry urgency, compatibility strength, and stock availability.
 *
 * Designed to be framework‑agnostic and easily reusable in APIs or other services.
 */

/**
 * Mapping of recipient blood type to compatible donor types according to ABO & Rh rules.
 * Includes O- as universal donor.
 */
const COMPATIBILITY_MAP = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

/**
 * Determine if a donor blood type is compatible with a recipient.
 * @param {string} recipientType - Patient blood type (e.g., "A+")
 * @param {string} donorType - Donor blood type (e.g., "O-")
 * @returns {boolean}
 */
function isCompatible(recipientType, donorType) {
  const compatible = COMPATIBILITY_MAP[recipientType] || [];
  return compatible.includes(donorType);
}

/**
 * Return a list of all donor types compatible with the given recipient.
 * @param {string} recipientType
 * @returns {string[]} Array of compatible donor blood types
 */
function getCompatibleDonorTypes(recipientType) {
  return COMPATIBILITY_MAP[recipientType] ? [...COMPATIBILITY_MAP[recipientType]] : [];
}

/**
 * Compute a numeric score for a blood unit.
 * Higher score = more desirable.
 *
 * Scoring components (weights can be tuned):
 *   - distanceWeight: closer hospitals are better (inverse of distance)
 *   - expiryWeight: units expiring sooner get higher priority
 *   - exactMatchWeight: exact ABO/Rh match gets a bonus
 *   - stockWeight: larger stock reduces urgency (inverse of quantity)
 *
 * @param {Object} unit - Blood unit object
 * @param {number} unit.distanceKm - Distance from donor location to hospital (km)
 * @param {Date}   unit.expiryDate - Expiry date of the unit
 * @param {string} unit.type - Blood type of the unit
 * @param {number} unit.quantity - Number of bags available
 * @param {string} recipientType - Patient blood type
 * @param {Object} [weights] - Optional custom weighting factors
 * @returns {number} Composite score
 */
function scoreUnit(unit, recipientType, weights = {}) {
  const {
    distanceWeight = 0.4,
    expiryWeight = 0.3,
    exactMatchWeight = 0.2,
    stockWeight = 0.1,
  } = weights;

  // 1️⃣ Distance component – closer is better (inverse relationship)
  const distanceScore = unit.distanceKm > 0 ? 1 / unit.distanceKm : 0;

  // 2️⃣ Expiry component – fewer days left = higher score
  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysToExpiry = Math.max(0, Math.round((unit.expiryDate - now) / msPerDay));
  // Avoid division by zero; treat already‑expired as 0 score
  const expiryScore = daysToExpiry > 0 ? 1 / daysToExpiry : 0;

  // 3️⃣ Compatibility strength – exact match gets a bonus
  const exactMatch = unit.type === recipientType ? 1 : 0;

  // 4️⃣ Stock availability – abundant stock reduces urgency (inverse)
  const stockScore = unit.quantity > 0 ? 1 / unit.quantity : 0;

  // Weighted sum
  return (
    distanceWeight * distanceScore +
    expiryWeight * expiryScore +
    exactMatchWeight * exactMatch +
    stockWeight * stockScore
  );
}

/**
 * Filter available blood units based on compatibility with the patient.
 * @param {string} recipientType - Patient blood type
 * @param {Array<Object>} units - List of blood unit objects
 * @returns {Array<Object>} Compatible units
 */
function filterCompatibleUnits(recipientType, units) {
  return units.filter((u) => isCompatible(recipientType, u.type));
}

/**
 * Rank compatible blood units and return the best match.
 * @param {string} recipientType - Patient blood type
 * @param {Array<Object>} units - List of blood unit objects (already filtered or full list)
 * @param {Object} [weights] - Optional custom weighting factors for scoring
 * @returns {Object|null} The highest‑scoring unit or null if none are compatible
 */
function findBestMatch(recipientType, units, weights) {
  const compatible = filterCompatibleUnits(recipientType, units);
  if (compatible.length === 0) return null;

  // Compute scores
  const scored = compatible.map((unit) => ({
    unit,
    score: scoreUnit(unit, recipientType, weights),
  }));

  // Sort descending by score (higher is better)
  scored.sort((a, b) => b.score - a.score);

  // Return the top unit (you could also return the whole sorted list if needed)
  return scored[0].unit;
}

/**
 * Public API – orchestrates the whole matching flow.
 * @param {string} patientBloodType - e.g., "A+"
 * @param {Array<Object>} availableUnits - Each unit must contain:
 *   { type: string, location: string, distanceKm: number, expiryDate: Date, quantity: number }
 * @param {Object} [options] - Optional configuration (weights, etc.)
 * @returns {{ compatibleTypes: string[], bestUnit: Object|null, rankedUnits: Array<Object> }}
 */
function matchBloodUnits(patientBloodType, availableUnits, options = {}) {
  const compatibleTypes = getCompatibleDonorTypes(patientBloodType);
  const compatibleUnits = filterCompatibleUnits(patientBloodType, availableUnits);

  // Score and rank all compatible units
  const ranked = compatibleUnits
    .map((unit) => ({
      unit,
      score: scoreUnit(unit, patientBloodType, options.weights),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => ({ ...entry.unit, score: entry.score }));

  const bestUnit = ranked.length > 0 ? ranked[0] : null;

  return {
    compatibleTypes,
    bestUnit,
    rankedUnits: ranked,
  };
}

// Export for Node.js or browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isCompatible,
    getCompatibleDonorTypes,
    filterCompatibleUnits,
    scoreUnit,
    findBestMatch,
    matchBloodUnits,
  };
}

/**
 * Example usage (uncomment to test locally):
 *
 * const units = [
 *   { type: 'O-', location: 'Warehouse A', distanceKm: 10, expiryDate: new Date('2026-05-01'), quantity: 5 },
 *   { type: 'A+', location: 'Hospital B', distanceKm: 2, expiryDate: new Date('2026-04-20'), quantity: 2 },
 *   // ...more units
 * ];
 * const result = matchBloodUnits('A+', units);
 * console.log(result);
 */
