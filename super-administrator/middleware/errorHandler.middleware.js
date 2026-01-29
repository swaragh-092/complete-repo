/*   
Author: Homshree 
Created: 17th June 2025
Description: Global Exception Handlers: To Catch unhandled errors outside of Express routes.
Version: 1.0.0
*/

const ResponseService = require('../services/Response');

const errorHandler = (err, req, res, next) => {
  // Extract context from req.thisAction
  const thisAction = {
    usedFor: req.thisAction?.usedFor || 'Unknown',
    action: req.thisAction?.action || 'Unknown',
  };

  // Log the error with detailed information
  console.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    type: err.name,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString(),
    details: err.errors || null,
  });

  // Handle specific error types
  if (err.name === 'SequelizeValidationError') {
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 422,
      ...thisAction,
      message: ResponseService.getErrorMessage(422, thisAction.usedFor, thisAction.action),
      errors: err.errors.map(e => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 409,
      ...thisAction,
      message: ResponseService.getUiMessage('register.exists'),
      errors: err.errors.map(e => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
      message: ResponseService.getErrorMessage(500, thisAction.usedFor, thisAction.action),
    });
  }

  // Handle "not found" errors with the original error message
  if (err.message.toLowerCase().includes('not found')) {
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 404,
      ...thisAction,
      message: err.message, // Use the original error message
    });
  }

  if (err.message.includes('Unauthorized') || err.message.includes('Invalid email or password')) {
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 401,
      ...thisAction,
      message: ResponseService.getUiMessage('login.failed'),
    });
  }

  if (err.message.includes('Forbidden')) {
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 403,
      ...thisAction,
      message: ResponseService.getErrorMessage(403, thisAction.usedFor, thisAction.action),
    });
  }

  // Default case for unhandled errors
  return ResponseService.apiResponse({
    res,
    success: false,
    status: 500,
    ...thisAction,
    message: ResponseService.getErrorMessage(500, thisAction.usedFor, thisAction.action),
  });
};

module.exports = errorHandler;