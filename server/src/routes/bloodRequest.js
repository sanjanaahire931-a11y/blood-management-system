/**
 * bloodRequest.js
 * Routes: POST /api/request-blood, GET /api/alerts
 *
 * No business logic here — delegates entirely to services.
 */

const express = require('express');
const router = express.Router();

const matchingService = require('../services/matchingService');
const routingService = require('../services/routingService');
const donorService = require('../services/donorService');
const alertService = require('../services/alertService');
const Request = require('../models/Request');
const { getIO } = require('../sockets/socketManager');
const { validate } = require('../middleware/validate');

/**
 * POST /api/request-blood
 * Core decision engine: match unit OR alert donors.
 */
router.post('/', validate('requestBlood'), async (req, res, next) => {
  try {
    const { bloodType, location, urgency } = req.body;

    // 1. Save request to DB
    const request = await Request.create({ bloodType, location, urgency });

    // Notify all clients of a new incoming request
    getIO().emit('NEW_REQUEST', {
      requestId: request._id,
      bloodType,
      location,
      urgency,
      timestamp: new Date().toISOString(),
    });

    // 2. Try to find a matching blood unit
    const bestUnit = await matchingService.findBestUnit(request);

    if (bestUnit) {
      // ── MATCH FOUND PATH ──────────────────────────────────────
      const route = await routingService.getRoute(bestUnit.location, location);

      // Update request in DB
      await Request.findByIdAndUpdate(request._id, {
        status: 'FOUND',
        assignedUnit: bestUnit._id,
      });

      // Emit WebSocket event
      getIO().emit('MATCH_FOUND', {
        requestId: request._id,
        bestUnit,
        route,
        estimatedTime: route.eta,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({
        status: 'FOUND',
        requestId: request._id,
        bestUnit,
        route,
        estimatedTime: route.eta,
      });
    } else {
      // ── NO UNIT AVAILABLE PATH ────────────────────────────────
      const donors = await donorService.findDonors(request);
      await alertService.triggerEmergencyAlert(request);

      // Update request status
      await Request.findByIdAndUpdate(request._id, { status: 'DONOR_ALERT' });

      return res.status(200).json({
        status: 'DONOR_ALERT',
        requestId: request._id,
        message: `No ${bloodType} units available. Nearby donors notified.`,
        donors,
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
