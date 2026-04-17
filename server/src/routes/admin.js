/**
 * admin.js
 * Optional admin and prediction routes.
 * GET /api/admin/stats
 * GET /api/admin/donors
 * GET /api/predict-demand
 */

const express = require('express');
const router = express.Router();

const BloodUnit = require('../models/BloodUnit');
const Donor = require('../models/Donor');
const Request = require('../models/Request');

/**
 * GET /api/admin/stats
 * Returns aggregated request statistics.
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [totalRequests, fulfilled, pending, donorAlerts] = await Promise.all([
      Request.countDocuments(),
      Request.countDocuments({ status: 'FULFILLED' }),
      Request.countDocuments({ status: 'PENDING' }),
      Request.countDocuments({ status: 'DONOR_ALERT' }),
    ]);

    // Breakdown by blood type
    const byBloodType = await Request.aggregate([
      { $group: { _id: '$bloodType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      totalRequests,
      fulfilled,
      pending,
      donorAlerts,
      found: await Request.countDocuments({ status: 'FOUND' }),
      byBloodType,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/donors
 * Returns all donors with their eligibility status.
 */
router.get('/donors', async (req, res, next) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ count: donors.length, donors });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/predict-demand
 * Stub: mock demand prediction. Plug in a real ML model later.
 * Query params: bloodType, days
 */
router.get('/predict-demand', async (req, res, next) => {
  try {
    const { bloodType, days = 7 } = req.query;

    // Stub: count past requests as a simple demand signal
    const query = bloodType ? { bloodType } : {};
    const historicalCount = await Request.countDocuments(query);

    const predicted = Math.round((historicalCount / 30) * Number(days));

    res.status(200).json({
      bloodType: bloodType || 'ALL',
      forecastDays: Number(days),
      predictedUnitsNeeded: predicted,
      confidence: 'LOW',
      note: 'Stub prediction based on historical request count. Replace with ML model.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
