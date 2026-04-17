/**
 * matchingService.js
 * Finds the best available blood unit for a request.
 * Searches both: (1) BloodUnit inventory and (2) Hospital blood banks (CSV-seeded).
 * Delegates all scoring logic to algorithms/matchingAlgorithm.js
 */

const BloodUnit = require('../models/BloodUnit');
const Hospital = require('../models/Hospital');
const { isCompatible, rankUnits } = require('../algorithms/matchingAlgorithm');

/**
 * Find the best matching blood unit for a given request.
 * @param {object} request - Request document (has .bloodType, .location)
 * @returns {object|null} Best matching result, or null if none found.
 *   Result shape: { source: 'inventory'|'hospital', unit, ... }
 */
async function findBestUnit(request) {
  // ── 1. Search BloodUnit inventory ────────────────────────────────────────
  const units = await BloodUnit.find({ status: 'AVAILABLE' });
  const compatibleUnits = units.filter((unit) =>
    isCompatible(unit.bloodType, request.bloodType)
  );

  if (compatibleUnits.length > 0) {
    const ranked = rankUnits(compatibleUnits, request);
    const best = ranked[0];
    return {
      source: 'inventory',
      bloodType: best.bloodType,
      quantity: best.quantity,
      location: best.location,
      hospitalId: best.hospitalId,
      unitId: best._id,
      unit: best,
    };
  }

  // ── 2. Fallback: Search hospital blood banks (seeded from CSV) ───────────
  const hospitalSource = await Hospital.findOne({
    isActive: true,
    bloodTypesAvailable: request.bloodType,
    totalUnitsAvailable: { $gt: 0 },
  }).lean();

  if (hospitalSource) {
    return {
      source: 'hospital',
      bloodType: request.bloodType,
      quantity: hospitalSource.bloodStock?.[request.bloodType] ?? 0,
      location: hospitalSource.location,
      hospitalId: hospitalSource._id,
      hospitalName: hospitalSource.name,
      hospitalAddress: hospitalSource.address,
      hospitalContact: hospitalSource.contact,
      unit: hospitalSource,
    };
  }

  return null;
}

module.exports = { findBestUnit };
