'use strict';

const express = require('express');
const router = express.Router();
const emailService = require('../services/email.service');
const authMiddleware = require('../middleware/auth.middleware');
const ResponseHandler = require('../utils/response');
const logger = require('../utils/logger');

// Apply auth middleware to all routes
router.use(authMiddleware);

const { schemas: validationSchemas, sendEmailSchema } = require('../utils/validation-schemas');

/**
 * POST /api/v1/email/send
 * Queue an email for sending (returns 202 Accepted)
 */
router.post('/send', async (req, res, next) => {
    try {
        // Validate type and basic fields
        const { error, value } = sendEmailSchema.validate(req.body);
        if (error) {
            return ResponseHandler.error(res, error.details[0].message, 400, 'VALIDATION_ERROR');
        }

        const { type, to, data } = value;

        // Validate payload against template-specific schema
        const dataSchema = validationSchemas[type];

        if (dataSchema) {
            const { error: dataError } = dataSchema.validate(data);
            if (dataError) {
                return ResponseHandler.error(
                    res,
                    `Invalid data for email type ${type}: ${dataError.details[0].message}`,
                    400,
                    'INVALID_PAYLOAD'
                );
            }
        } else {
            logger.warn(`No validation schema found for email type: ${type}`);
        }

        // Queue email (returns immediately)
        const result = await emailService.send({ type, to, data });

        return ResponseHandler.success(res, result, 'Email queued successfully', 202);
    } catch (err) {
        logger.error('Failed to queue email', { error: err.message });
        next(err);
    }
});

/**
 * GET /api/v1/email/types
 * Get available email types
 */
router.get('/types', (req, res) => {
    return ResponseHandler.success(res, {
        types: emailService.getTypes(),
    }, 'Available email types');
});

/**
 * GET /api/v1/email/history
 * Get email sending history with pagination
 * Query params: page, limit, status, type, to
 */
router.get('/history', async (req, res, next) => {
    try {
        const { page, limit, status, type, to } = req.query;

        const result = await emailService.getHistory({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            status,
            type,
            to,
        });

        return ResponseHandler.success(res, result, 'Email history retrieved');
    } catch (err) {
        logger.error('Failed to get email history', { error: err.message });
        next(err);
    }
});

/**
 * GET /api/v1/email/stats
 * Get email sending statistics
 */
router.get('/stats', async (req, res, next) => {
    try {
        const stats = await emailService.getStats();
        return ResponseHandler.success(res, stats, 'Email statistics retrieved');
    } catch (err) {
        logger.error('Failed to get email stats', { error: err.message });
        next(err);
    }
});

/**
 * POST /api/v1/email/resend/:id
 * Resend a failed email by log ID
 */
router.post('/resend/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await emailService.resend(id);

        return ResponseHandler.success(res, result, 'Email re-queued successfully', 202);
    } catch (err) {
        logger.error('Failed to resend email', { error: err.message, logId: req.params.id });
        next(err);
    }
});

module.exports = router;
