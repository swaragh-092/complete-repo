// middleware/errorHandler.js
const logger = require('../utils/logger');
// Dynamic require to avoid circular dependencies if any, though AuditService seems safe
const AuditService = require('../services/audit.service');

/**
 * Custom Application Error class for operational errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized Error Handler Middleware
 */
const errorHandler = async (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let details = err.details || null;

  // Handle specific error types

  // Sequelize Validation Errors
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
    details = err.errors.map(e => ({ field: e.path, message: e.message }));
  }
  // Sequelize Unique Constraint Errors
  else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Duplicate Entry';
    code = 'DUPLICATE_ENTRY';
    details = err.errors.map(e => ({ field: e.path, message: e.message, value: e.value }));
  }
  // Joi Validation Errors (if not handled by middleware)
  else if (err.isJoi) {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
    details = err.details.map(d => ({ message: d.message, path: d.path }));
  }
  // JWT Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    code = 'UNAUTHORIZED';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }
  // Syntax Errors (e.g. invalid JSON)
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid structured data (JSON)';
    code = 'INVALID_JSON';
  }

  // 1. Log to Application Logger (Console/File)
  // Log stack trace only for 500 errors or when explicitly requested, to reduce noise
  if (statusCode >= 500) {
    logger.error(`[${code}] ${message}`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId: req.user?.sub || req.user?.id || 'anonymous',
      stack: err.stack,
      details
    });
  } else {
    logger.warn(`[${code}] ${message}`, {
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.sub || req.user?.id || 'anonymous',
      statusCode
    });
  }

  // 2. Audit Log Integration
  // We explicitly try/catch this so that audit log failures do not crash the error response
  try {
    // Only audit log significant errors (server errors, security errors, or important validation errors)
    // You can adjust this filter based on requirements. 
    // Usually, we want to audit everything that might be security relevant.
    const shouldAudit = statusCode >= 500 ||
      code === 'UNAUTHORIZED' ||
      code === 'FORBIDDEN' ||
      code === 'DUPLICATE_ENTRY' ||
      (req.method !== 'GET'); // Audit state-changing failures

    if (shouldAudit) {
      const severity = statusCode >= 500 ? 'ERROR' : 'WARNING';
      const userId = req.user?.sub || req.user?.id || req.user?.keycloak_id;

      await AuditService.log({
        action: 'API_ERROR',
        userId: userId,
        clientId: req.user?.azp || req.user?.client_id,
        orgId: req.user?.org_id,

        // Environment & System Context
        sourceIP: req.ip,
        userAgent: req.get('User-Agent'),

        status: 'FAILURE',
        severity,
        message: `${code}: ${message}`,

        metadata: {
          method: req.method,
          url: req.originalUrl,
          statusCode,
          errorCode: code,
          // Only include details if they don't contain sensitive info. 
          // Validation errors are usually safe.
          details: details ? JSON.stringify(details) : null
        }
      });
    }
  } catch (auditErr) {
    // Fallback logging for audit failure
    logger.error('Failed to write error to audit log', {
      originalError: message,
      auditError: auditErr.message
    });
  }

  // 3. Send Standardized JSON Response
  const response = {
    success: false,
    error: code,
    message,
    ...(details && { details }),
    // Include stack trace only in development/test environments
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };

  // Ensure status code is valid HTTP status
  const validStatus = (statusCode >= 100 && statusCode < 600) ? statusCode : 500;

  res.status(validStatus).json(response);
};

module.exports = { AppError, errorHandler };
