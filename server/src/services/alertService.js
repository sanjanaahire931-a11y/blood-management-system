/**
 * alertService.js
 * Manages emergency alerts, stock level checks, and expiry monitoring.
 * Emits Socket.io events from this service — never from routes.
 */

const BloodUnit = require('../models/BloodUnit');
const { getIO } = require('../sockets/socketManager');

const LOW_STOCK_THRESHOLD = 5;
const EXPIRY_WARNING_DAYS = 3;

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

/**
 * Trigger an emergency donor alert for a blood request.
 * Emits DONOR_ALERT event to all connected WebSocket clients.
 * @param {object} request - Request document
 */
async function triggerEmergencyAlert(request) {
  try {
    getIO().emit('DONOR_ALERT', {
      requestId: request._id,
      bloodType: request.bloodType,
      location: request.location,
      urgency: request.urgency,
      message: `Emergency: ${request.bloodType} blood needed urgently!`,
      timestamp: new Date().toISOString(),
    });
    console.log(`[Alert] DONOR_ALERT emitted for request ${request._id}`);
  } catch (err) {
    console.error('[Alert] Failed to emit DONOR_ALERT:', err.message);
  }
}

/**
 * Check inventory levels for each blood type.
 * Logs and emits a LOW_STOCK alert if any type falls below threshold.
 */
async function checkStockLevels() {
  try {
    const alerts = [];
    for (const type of BLOOD_TYPES) {
      const result = await BloodUnit.aggregate([
        { $match: { bloodType: type, status: 'AVAILABLE', expiryDate: { $gt: new Date() } } },
        { $group: { _id: '$bloodType', total: { $sum: '$quantity' } } },
      ]);
      const total = result[0]?.total ?? 0;
      if (total < LOW_STOCK_THRESHOLD) {
        alerts.push({ bloodType: type, total, threshold: LOW_STOCK_THRESHOLD });
        console.warn(`[Alert] LOW STOCK — ${type}: ${total} units (threshold: ${LOW_STOCK_THRESHOLD})`);
      }
    }
    if (alerts.length > 0) {
      getIO().emit('LOW_STOCK', { alerts, timestamp: new Date().toISOString() });
    }
    return alerts;
  } catch (err) {
    console.error('[Alert] checkStockLevels error:', err.message);
    return [];
  }
}

/**
 * Find blood units expiring within EXPIRY_WARNING_DAYS days.
 * Logs expiry alerts. Run this on a cron schedule (every 12 hours).
 */
async function checkExpiry() {
  try {
    const warningDate = new Date(Date.now() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);
    const expiringUnits = await BloodUnit.find({
      status: 'AVAILABLE',
      expiryDate: { $gt: new Date(), $lte: warningDate },
    });

    if (expiringUnits.length > 0) {
      console.warn(`[Alert] ${expiringUnits.length} unit(s) expiring within ${EXPIRY_WARNING_DAYS} days.`);
      getIO().emit('EXPIRY_WARNING', {
        units: expiringUnits,
        timestamp: new Date().toISOString(),
      });
    }
    return expiringUnits;
  } catch (err) {
    console.error('[Alert] checkExpiry error:', err.message);
    return [];
  }
}

/**
 * Get current system alerts: low stock + near-expiry units.
 * Used by GET /api/alerts route.
 */
async function getActiveAlerts() {
  const warningDate = new Date(Date.now() + EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);

  // Low stock per blood type
  const stockAlerts = [];
  for (const type of BLOOD_TYPES) {
    const result = await BloodUnit.aggregate([
      { $match: { bloodType: type, status: 'AVAILABLE', expiryDate: { $gt: new Date() } } },
      { $group: { _id: '$bloodType', total: { $sum: '$quantity' } } },
    ]);
    const total = result[0]?.total ?? 0;
    if (total < LOW_STOCK_THRESHOLD) {
      stockAlerts.push({ type: 'LOW_STOCK', bloodType: type, totalUnits: total });
    }
  }

  // Expiry alerts
  const expiringUnits = await BloodUnit.find({
    status: 'AVAILABLE',
    expiryDate: { $gt: new Date(), $lte: warningDate },
  }).select('bloodType quantity expiryDate hospitalId');

  const expiryAlerts = expiringUnits.map((u) => ({
    type: 'EXPIRY',
    bloodType: u.bloodType,
    quantity: u.quantity,
    expiryDate: u.expiryDate,
    hospitalId: u.hospitalId,
  }));

  return [...stockAlerts, ...expiryAlerts];
}

module.exports = { triggerEmergencyAlert, checkStockLevels, checkExpiry, getActiveAlerts };
