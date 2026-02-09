'use strict';

const logger = require('../utils/logger');
const ResponseHandler = require('../utils/response');

/**
 * Global Error Handler Middleware
 */
const errorMiddleware = (err, req, res, next) => {
    logger.error('Unhandled error', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const code = err.code || 'INTERNAL_ERROR';

    return ResponseHandler.error(res, message, statusCode, code);
};

module.exports = errorMiddleware;
