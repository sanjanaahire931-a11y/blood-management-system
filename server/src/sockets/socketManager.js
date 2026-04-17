/**
 * socketManager.js
 * Manages the Socket.io server instance.
 * Services import getIO() to emit events — never routes.
 */

const { Server } = require('socket.io');

let io = null;

/**
 * Attach Socket.io to the existing HTTP server.
 * Call once from server.js after HTTP server is created.
 * @param {http.Server} httpServer
 * @returns {Server} io instance
 */
function init(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Returns the active Socket.io instance.
 * Throws if init() has not been called yet.
 */
function getIO() {
  if (!io) throw new Error('Socket.io not initialized. Call init(httpServer) first.');
  return io;
}

module.exports = { init, getIO };
