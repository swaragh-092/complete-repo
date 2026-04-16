'use strict';

const Joi = require('joi');

const globalSettingSchema = Joi.object({
    key: Joi.string().required(),
    value: Joi.any().required(),
    type: Joi.string().valid('number', 'boolean', 'string', 'json').optional(),
    category: Joi.string().valid('limits', 'security', 'features', 'branding', 'system').optional(),
    description: Joi.string().optional().allow('', null),
    is_public: Joi.boolean().optional()
});

const updateGlobalSettingsSchema = Joi.object({
    settings: Joi.array().items(globalSettingSchema).min(1).required()
});

const updateOrgSettingsSchema = Joi.object({
    settings: Joi.object().pattern(
        Joi.string(),
        Joi.any()
    ).required()
});

module.exports = {
    updateGlobalSettingsSchema,
    updateOrgSettingsSchema
};
