/**
 * hospitals.js
 * Routes for hospital and blood bank data (seeded from CSV).
 *
 * GET  /api/hospitals            → list all hospitals
 * GET  /api/hospitals/search     → search by name or blood type
 * GET  /api/hospitals/:id        → get single hospital
 * PUT  /api/hospitals/:id/stock  → update blood stock for a hospital
 */

const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

/**
 * GET /api/hospitals
 * Returns all hospitals. Optional query: ?type=blood_bank (only those with stock)
 */
router.get('/', async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    if (type === 'blood_bank') {
      filter.totalUnitsAvailable = { $gt: 0 };
    }

    const hospitals = await Hospital.find(filter)
      .sort({ name: 1 })
      .lean();

    res.status(200).json({ count: hospitals.length, hospitals });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/search
 * Query params:
 *   name=<string>       → partial, case-insensitive hospital name match
 *   bloodType=<type>    → filter hospitals that have this blood type available
 *   lat=<num>&lng=<num> → (future) location-based sort
 */
router.get('/search', async (req, res, next) => {
  try {
    const { name, bloodType } = req.query;
    const filter = { isActive: true };

    if (name) {
      filter.name = { $regex: name.trim(), $options: 'i' };
    }

    if (bloodType) {
      if (!BLOOD_TYPES.includes(bloodType)) {
        return res.status(400).json({
          error: true,
          message: `Invalid bloodType. Must be one of: ${BLOOD_TYPES.join(', ')}`,
          code: 400,
        });
      }
      filter.bloodTypesAvailable = bloodType;
    }

    const hospitals = await Hospital.find(filter).sort({ name: 1 }).lean();

    res.status(200).json({ count: hospitals.length, hospitals });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/:id
 * Returns a single hospital by MongoDB _id.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id).lean();
    if (!hospital) {
      return res.status(404).json({ error: true, message: 'Hospital not found', code: 404 });
    }
    res.status(200).json({ hospital });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/hospitals/:id/stock
 * Update blood stock for a specific hospital.
 * Body: { "O+": 10, "A-": 5, ... }
 */
router.put('/:id/stock', async (req, res, next) => {
  try {
    const updates = req.body;
    const validUpdates = {};
    let total = 0;

    for (const [type, qty] of Object.entries(updates)) {
      if (!BLOOD_TYPES.includes(type)) {
        return res.status(400).json({
          error: true,
          message: `Invalid blood type: "${type}"`,
          code: 400,
        });
      }
      if (typeof qty !== 'number' || qty < 0) {
        return res.status(400).json({
          error: true,
          message: `Quantity for ${type} must be a non-negative number`,
          code: 400,
        });
      }
      validUpdates[`bloodStock.${type}`] = qty;
      total += qty;
    }

    // Rebuild bloodTypesAvailable from new stock
    const bloodTypesAvailable = Object.entries({ ...updates })
      .filter(([, qty]) => qty > 0)
      .map(([type]) => type);

    const hospital = await Hospital.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...validUpdates,
          totalUnitsAvailable: total,
          bloodTypesAvailable,
        },
      },
      { new: true }
    );

    if (!hospital) {
      return res.status(404).json({ error: true, message: 'Hospital not found', code: 404 });
    }

    res.status(200).json({ message: 'Stock updated successfully.', hospital });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
