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

const fs = require('fs');
const path = require('path');

/**
 * GET /api/inventory
 * Returns all available blood units by flat-mapping the CSV.
 */
router.get('/inventory', (req, res, next) => {
  try {
    const csvPath = path.join(__dirname, '../../data/hospitals.csv');
    const file = fs.readFileSync(csvPath, 'utf8');
    const lines = file.split('\n').filter(l => l.trim().length > 0);
    
    let units = [];
    
    for (let i = 1; i < lines.length; i++) {
      const raw = lines[i];
      if (raw.includes('{')) {
        try {
          const jsonStr = raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1).replace(/""/g, '"');
          const bloodObj = JSON.parse(jsonStr);
          const parts = raw.split(',');
          const hospName = parts[2];
          
          for (const [type, qty] of Object.entries(bloodObj)) {
            if (qty > 0) {
              // Creating a distinct object for each type bundle available in the hospital
              units.push({
                _id: `UNIT-${i}-${type.replace(/[+-]/g, '')}`,
                bloodType: type,
                quantity: qty,
                location: hospName,
                hospitalId: `HOSP-${i}`,
                // Simulate random expiry
                expiryDate: new Date(Date.now() + (Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString()
              });
            }
          }
        } catch(e) {}
      }
    }

    res.status(200).json({ count: units.length, units });
  } catch (err) {
    console.error("CSV Inventory Parse Error", err);
    next(err);
  }
});

module.exports = router;
