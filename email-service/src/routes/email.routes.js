'use strict';

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const emailService = require('../services/email.service');
const authMiddleware = require('../middleware/auth.middleware');
const ResponseHandler = require('../utils/response');
const { EMAIL_TYPES } = require('../config/constants');
const logger = require('../utils/logger');

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * Request validation schema
 */
const sendEmailSchema = Joi.object({
    type: Joi.string()
        .valid(...Object.keys(EMAIL_TYPES))
        .required()
        .messages({
            'any.only': `Invalid email type. Must be one of: ${Object.keys(EMAIL_TYPES).join(', ')}`,
        }),
    to: Joi.string().email().required(),
    data: Joi.object().required(),
});

/**
 * POST /api/v1/email/send
 * Send an email
 */
router.post('/send', async (req, res, next) => {
    try {
        // Validate request body
        const { error, value } = sendEmailSchema.validate(req.body);
        if (error) {
            return ResponseHandler.error(
                res,
                error.details[0].message,
                400,
                'VALIDATION_ERROR'
            );
        }

        const { type, to, data } = value;

        // Send email
        const result = await emailService.send({ type, to, data });

        return ResponseHandler.success(res, result, 'Email sent successfully');
    } catch (err) {
        logger.error('Failed to send email', { error: err.message });
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

module.exports = router;
