/**
 * donor.js
 * Routes: POST /api/register-donor
 */

const express = require('express');
const router = express.Router();

const Donor = require('../models/Donor');
const { validate } = require('../middleware/validate');

/**
 * POST /api/register-donor
 * Register a new blood donor.
 * isEligible is automatically computed by the Donor model's pre-save hook.
 */
router.post('/', validate('registerDonor'), async (req, res, next) => {
  try {
    const { name, bloodType, location, contact, lastDonation } = req.body;

    const donor = await Donor.create({ name, bloodType, location, contact, lastDonation });

    res.status(201).json({
      message: 'Donor registered successfully.',
      donor,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
