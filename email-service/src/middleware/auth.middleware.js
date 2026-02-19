'use strict';

const config = require('../config');
const AppError = require('../utils/AppError');

/**
 * Auth Middleware
 * Validates x-service-secret header for internal API authentication
 * Uses next(err) pattern (not throw) so Express error handler catches it
 */
const authMiddleware = (req, res, next) => {
    try {
        const serviceSecret = req.headers['x-service-secret'];

        if (!serviceSecret) {
            return next(AppError.unauthorized('Missing x-service-secret header'));
        }

        if (serviceSecret !== config.SERVICE_SECRET) {
            return next(AppError.unauthorized('Invalid service secret'));
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = authMiddleware;
