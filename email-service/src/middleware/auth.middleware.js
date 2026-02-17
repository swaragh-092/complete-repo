'use strict';

const config = require('../config');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * Auth Middleware
 * Validates x-service-secret header for internal API authentication
 */
const authMiddleware = (req, res, next) => {
    const serviceSecret = req.headers['x-service-secret'];

    if (!serviceSecret) {
        throw AppError.unauthorized('Missing x-service-secret header');
    }

    if (serviceSecret !== config.SERVICE_SECRET) {
        throw AppError.unauthorized('Invalid service secret');
    }

    next();
};

module.exports = authMiddleware;
