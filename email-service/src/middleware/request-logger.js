'use strict';

const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

/**
 * Request Logger Middleware
 * - Assigns correlation ID (x-request-id) for cross-service tracing
 * - Logs incoming requests with timing
 */
const requestLogger = (req, res, next) => {
    // Correlation ID: use incoming header or generate a new one
    const requestId = req.headers['x-request-id'] || randomUUID();
    req.id = requestId;
    res.setHeader('x-request-id', requestId);

    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? 'warn' : 'info';

        logger[level](`${req.method} ${req.path}`, {
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            requestId,
        });
    });

    next();
};

module.exports = requestLogger;
