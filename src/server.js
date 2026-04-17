/**
 * server.js — BloodTrack India Ultra Entry Point
 *
 * Startup sequence:
 *  1. Load environment variables
 *  2. Create Express app
 *  3. Create HTTP server
 *  4. Init Socket.io (must happen before routes are loaded that import socketManager)
 *  5. Connect to MongoDB
 *  6. Mount routes
 *  7. Register global error handler
 *  8. Start listening
 *  9. Schedule cron jobs
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const { init: initSocket } = require('./sockets/socketManager');
const errorHandler = require('./middleware/errorHandler');

// Routes
const bloodRequestRoutes = require('./routes/bloodRequest');
const inventoryRoutes = require('./routes/inventory');
const donorRoutes = require('./routes/donor');
const adminRoutes = require('./routes/admin');
const hospitalRoutes = require('./routes/hospitals');

// ── App & HTTP Server ────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ── Socket.io Init (must come before any service that calls getIO()) ─────────
initSocket(httpServer);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'BloodTrack India Ultra', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/request-blood', bloodRequestRoutes);
app.use('/api', inventoryRoutes);               // /api/add-blood, /api/inventory
app.use('/api/register-donor', donorRoutes);
app.use('/api/admin', adminRoutes);             // /api/admin/stats, /api/admin/donors
app.use('/api/hospitals', hospitalRoutes);      // /api/hospitals (CSV-seeded)
// GET /api/alerts — inline handler (avoids coupling to bloodRequest router)
app.get('/api/alerts', async (req, res, next) => {
  try {
    const { getActiveAlerts } = require('./services/alertService');
    const alerts = await getActiveAlerts();
    res.status(200).json({ alerts, count: alerts.length });
  } catch (err) {
    next(err);
  }
});

// ── Global Error Handler (MUST be last) ─────────────────────────────────────
app.use(errorHandler);

// ── MongoDB Connection ────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloodtrack';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`[MongoDB] Connected to ${MONGODB_URI}`);
  } catch (err) {
    console.warn('[MongoDB] Connection failed:', err.message);
    console.warn('[MongoDB] Server will continue without DB, some API endpoints may fail.');
    // REMOVED: process.exit(1);
  }
}

// ── Cron Jobs ──────────────────────────────────────────────────────────────────
function scheduleCronJobs() {
  const { checkExpiry } = require('./services/alertService');

  // Run expiry check every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    console.log('[Cron] Running expiry check...');
    await checkExpiry();
  });

  console.log('[Cron] Scheduled: expiry check every 12 hours');
}

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`\n🩸 BloodTrack India Ultra is running!`);
    console.log(`   → HTTP:   http://localhost:${PORT}`);
    console.log(`   → Socket: ws://localhost:${PORT}`);
    console.log(`   → Env:    ${process.env.NODE_ENV || 'development'}\n`);
  });

  scheduleCronJobs();
})();
