/**
 * matchingAlgorithm.js
 *
 * Real implementations wrapper around the core blood_matching_engine.
 */

const { isCompatible: coreIsCompatible, scoreUnit, matchBloodUnits } = require('../../blood_matching_engine');

function isCompatible(unitType, requestType) {
  return coreIsCompatible(requestType, unitType); // engine expects recipientType, donorType
}

function calculateScore(unit, request) {
  // Map our DB unit shape to the engine's expected shape if needed, 
  // or just pass it in. Engine expects: { type, distanceKm, expiryDate, quantity }
  // Our DB unit usually has bloodType and expiryDate. We'll approximate distance if missing.
  
  const mappedUnit = {
    type: unit.bloodType,
    expiryDate: new Date(unit.expiryDate),
    distanceKm: unit.distanceKm || 10, // stub distance
    quantity: unit.quantity || 1
  };
  
  return scoreUnit(mappedUnit, request.bloodType);
}

function rankUnits(units, request) {
  const mappedUnits = units.map(u => ({
    ...u,
    type: u.bloodType,
    expiryDate: new Date(u.expiryDate),
    distanceKm: u.distanceKm || Math.random() * 20, 
    quantity: u.quantity || 1
  }));
  
  const result = matchBloodUnits(request.bloodType, mappedUnits);
  
  // Since we spread ...u into mappedUnits, all original mongoose properties are preserved.
  return result.rankedUnits;
}

module.exports = { isCompatible, calculateScore, rankUnits };
