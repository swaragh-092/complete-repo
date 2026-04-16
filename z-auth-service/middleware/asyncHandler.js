

// middleware/asyncHandler.js

/**
 * Async Handler Middleware
 * 
 * Wraps async route handlers to automatically catch errors and pass them to Express error middleware.
 * This eliminates the need to write try/catch blocks in every async route handler.
 * 
 * Usage:
 * router.get('/path', asyncHandler(async (req, res) => {
 *   // Your async code here - errors are automatically caught
 *   const data = await someAsyncOperation();
 *   res.json(data);
 * }));
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;