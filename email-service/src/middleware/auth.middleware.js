'use strict';

const config = require('../config');
const logger = require('../utils/logger');
const ResponseHandler = require('../utils/response');

/**
 * Middleware to validate SERVICE_SECRET header
 * Protects internal API from unauthorized access
 */
const authMiddleware = (req, res, next) => {
    const serviceSecret = req.headers['x-service-secret'];

    if (!serviceSecret) {
        logger.warn('Missing x-service-secret header', { ip: req.ip, path: req.path });
        return ResponseHandler.error(res, 'Unauthorized: Missing Service Secret', 401, 'UNAUTHORIZED');
    }

    if (serviceSecret !== config.SERVICE_SECRET) {
        logger.warn('Invalid service secret', { ip: req.ip, path: req.path });
        return ResponseHandler.error(res, 'Unauthorized: Invalid Service Secret', 401, 'UNAUTHORIZED');
    }

    next();
};

module.exports = authMiddleware;
