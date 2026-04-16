'use strict';

const Joi = require('joi');

/**
 * Validator for POST /api/workspaces/members/lookup
 * 
 * At least one of user_ids or workspace_ids must be provided.
 * Both arrays are capped at 50 items to prevent abuse.
 */
const memberLookupSchema = Joi.object({
    user_ids: Joi.array()
        .items(Joi.string().uuid())
        .max(50)
        .optional()
        .default([]),
    workspace_ids: Joi.array()
        .items(Joi.string().uuid())
        .max(50)
        .optional()
        .default([]),
    user_id_type: Joi.string()
        .valid('id', 'keycloak_id')
        .optional()
        .default('keycloak_id')
}).custom((value, helpers) => {
    const hasUsers = value.user_ids && value.user_ids.length > 0;
    const hasWorkspaces = value.workspace_ids && value.workspace_ids.length > 0;
    if (!hasUsers && !hasWorkspaces) {
        return helpers.error('any.custom', {
            message: 'At least one of user_ids or workspace_ids must be provided'
        });
    }
    return value;
}).messages({
    'any.custom': '{{#message}}'
});

module.exports = { memberLookupSchema };
