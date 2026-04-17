/**
 * inventory.js
 * Routes: POST /api/add-blood, GET /api/inventory
 */

const express = require('express');
const router = express.Router();

const BloodUnit = require('../models/BloodUnit');
const alertService = require('../services/alertService');
const { validate } = require('../middleware/validate');

/**
 * POST /api/add-blood
 * Add a new blood unit to the inventory.
 */
router.post('/add-blood', validate('addBlood'), async (req, res, next) => {
  try {
    const { bloodType, quantity, expiryDate, location, hospitalId } = req.body;

    const unit = await BloodUnit.create({
      bloodType,
      quantity,
      expiryDate,
      location,
      hospitalId,
      status: 'AVAILABLE',
    });

    // Fire-and-forget: check if adding this unit resolves any stock alerts
    alertService.checkStockLevels().catch(console.error);

    res.status(201).json({
      message: 'Blood unit added successfully.',
      unit,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/inventory
 * Returns all available blood units, sorted by soonest expiry first.
 */
router.get('/inventory', async (req, res, next) => {
  try {
    const units = await BloodUnit.find({ status: 'AVAILABLE' })
      .sort({ expiryDate: 1 })
      .lean();

    res.status(200).json({ count: units.length, units });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
