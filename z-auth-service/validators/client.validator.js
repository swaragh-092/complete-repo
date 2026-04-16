/**
 * Client Validation Schemas
 * For Keycloak client management
 */
const { Joi, name, description } = require('./common');

// Create Client
const createClientSchema = Joi.object({
    name: name.required(),
    client_key: Joi.string().alphanum().min(2).max(50).required(),
    redirect_url: Joi.string().uri().required(),
    callback_url: Joi.string().uri().optional(),
    description: description.optional(),
    requires_organization: Joi.boolean().optional().default(false),
    organization_model: Joi.string()
        .valid('single', 'multi', 'workspace', 'enterprise')
        .optional(),
    onboarding_flow: Joi.string()
        .valid('create_org', 'invitation_only', 'domain_matching', 'flexible')
        .optional(),
    organization_features: Joi.array().items(Joi.string()).optional(),
});

// Update Client
const updateClientSchema = Joi.object({
    name: name.optional(),
    redirect_url: Joi.string().uri().optional(),
    callback_url: Joi.string().uri().optional(),
    description: description.optional(),
    enabled: Joi.boolean().optional(),
}).min(1);

// Client ID Param
const clientIdParamSchema = Joi.object({
    clientId: Joi.string().required(),
});

module.exports = {
    createClientSchema,
    updateClientSchema,
    clientIdParamSchema,
};
