'use strict';

const logger = require('../utils/logger');
const ResponseHandler = require('../utils/response');
const AppError = require('../utils/AppError');
const config = require('../config');

/**
 * Global Error Handler Middleware
 * - Hides stack traces in production
 * - Handles Sequelize validation errors
 * - Distinguishes operational vs programmer errors
 */
const errorMiddleware = (err, req, res, next) => {
    // Sequelize validation errors → 400
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        const messages = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
        logger.warn('Validation error', {
            path: req.path,
            method: req.method,
            errors: messages,
            requestId: req.id,
        });
        return ResponseHandler.error(res, messages, 400, 'VALIDATION_ERROR');
    }

    // Determine error details
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const isOperational = err instanceof AppError || err.isOperational === true;

    // Log based on severity
    if (statusCode >= 500 || !isOperational) {
        logger.error('Unhandled error', {
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            requestId: req.id,
        });
    } else {
        logger.warn('Client error', {
            message: err.message,
            code,
            path: req.path,
            requestId: req.id,
        });
    }

    // Build response — hide internals in production
    const message = (config.isProduction && statusCode >= 500 && !isOperational)
        ? 'Internal Server Error'
        : err.message || 'Internal Server Error';

    return ResponseHandler.error(res, message, statusCode, code);
};

module.exports = errorMiddleware;
