'use strict';

const Joi = require('joi');

const createRequestSchema = Joi.object({
    type: Joi.string().valid('limit_increase', 'feature_access', 'other').required(),
    details: Joi.object().required().keys({
        requested_setting: Joi.string().required(),
        current_value: Joi.any().optional(),
        requested_value: Joi.any().required(),
        reason: Joi.string().max(1000).required()
    })
});

const resolveRequestSchema = Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    reason: Joi.string().max(1000).optional()
});

module.exports = {
    createRequestSchema,
    resolveRequestSchema
};
