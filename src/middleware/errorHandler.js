/**
 * errorHandler.js
 * Global Express error handling middleware.
 * Must be registered as the LAST middleware in server.js.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.url} →`, err.stack || message);

  res.status(statusCode).json({
    error: true,
    message,
    code: statusCode,
  });
}

module.exports = errorHandler;
