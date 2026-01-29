/**
 * Organization Validation Schemas
 * Extracted from routes/organizations/onboarding.routes.js
 */
const { Joi, name, description, uuid, email } = require('./common');

// Create Organization (self-service)
const createOrgSchema = Joi.object({
    name: name.required(),
    client_key: Joi.string().required(),
    description: description.optional(),
    settings: Joi.object().optional(),
});

// Join Organization via Invitation Code
const joinOrgSchema = Joi.object({
    invitation_code: Joi.string().required(),
});

// Provision Organization (admin)
const provisionOrgSchema = Joi.object({
    org_name: name.required(),
    owner_email: email.required(),
    role_id: uuid.optional(),
    description: description.optional(),
});

// Update Organization
const updateOrgSchema = Joi.object({
    name: name.optional(),
    description: description.optional(),
    status: Joi.string().valid('active', 'inactive', 'pending').optional(),
    settings: Joi.object().optional(),
}).min(1);

// Organization ID Param
const orgIdParamSchema = Joi.object({
    orgId: uuid.required(),
});

module.exports = {
    createOrgSchema,
    joinOrgSchema,
    provisionOrgSchema,
    updateOrgSchema,
    orgIdParamSchema,
};
