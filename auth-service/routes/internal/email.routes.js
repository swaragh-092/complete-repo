const express = require('express');
const router = express.Router();
const emailModule = require('../../modules/email');
const logger = require('../../utils/logger');
const ResponseHandler = require('../../utils/responseHandler');
const { AppError } = require('../../middleware/errorHandler');

// Middleware to check service secret
const requireServiceSecret = (req, res, next) => {
    const serviceSecret = req.headers['x-service-secret'];
    const expectedSecret = process.env.SERVICE_SECRET;

    if (!expectedSecret) {
        logger.error('SERVICE_SECRET is not defined in environment variables');
        return next(new AppError('Internal configuration error', 500, 'CONFIG_ERROR'));
    }

    if (!serviceSecret || serviceSecret !== expectedSecret) {
        logger.warn(`Unauthorized internal API access attempt from ${req.ip}`);
        return next(new AppError('Unauthorized: Invalid Service Secret', 401, 'UNAUTHORIZED'));
    }

    next();
};

// Apply middleware to all routes in this router
router.use(requireServiceSecret);

/**
 * POST /api/internal/email/send
 * Internal endpoint to trigger emails from other services
 */
router.post('/send', async (req, res, next) => {
    try {
        const { type, to, data } = req.body;

        if (!type || !to || !data) {
            throw new AppError('Missing required fields: type, to, data', 400, 'VALIDATION_ERROR');
        }

        logger.info(`📧 Internal API: Sending email [${type}] to [${to}]`);

        // Check if type is valid
        if (!emailModule.EMAIL_TYPES[type]) {
            throw new AppError(`Invalid email type: ${type}`, 400, 'INVALID_EMAIL_TYPE');
        }

        await emailModule.send({ type, to, data });

        return ResponseHandler.success(res, { message: 'Email queued successfully' });
    } catch (error) {
        logger.error('❌ Internal API: Failed to send email:', error);
        next(error);
    }
});

module.exports = router;
