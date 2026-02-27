const Joi = require('joi');

/* --------- ORGANIZATIONS CRUD SCHEMAS --------- */
const createOrganizationSchema = Joi.object({
    name: Joi.string().min(2).max(255).required(),
    tenant_id: Joi.string().max(50).optional(),
    description: Joi.string().max(500).optional().allow(null, '')
});

const updateOrganizationSchema = Joi.object({
    name: Joi.string().min(2).max(255).optional(),
    tenant_id: Joi.string().max(50).optional(),
    description: Joi.string().max(500).optional().allow(null, ''),
    status: Joi.string().valid('active', 'inactive', 'pending').optional(),
    settings: Joi.object().optional()
}).min(1);

/* --------- MEMBERSHIP SCHEMAS --------- */
const createMembershipSchema = Joi.object({
    user_id: Joi.string().uuid().required(),
    org_id: Joi.string().uuid().required(),
    role_id: Joi.string().uuid().required()
});

const updateMembershipSchema = Joi.object({
    role_id: Joi.string().uuid().required()
});

const bulkAssignSchema = Joi.object({
    user_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
    org_id: Joi.string().uuid().required(),
    role_id: Joi.string().uuid().required()
});

/* --------- ONBOARDING & PROVISIONING SCHEMAS --------- */
const createOrgSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    client_key: Joi.string().required(),
    description: Joi.string().max(500).optional(),
    settings: Joi.object().optional()
});

const joinOrgSchema = Joi.object({
    invitation_code: Joi.string().required()
});

const createInvitationSchema = Joi.object({
    org_id: Joi.string().uuid().required(),
    invited_email: Joi.string().email().required(),
    role_id: Joi.string().uuid().required(),
    expires_in_days: Joi.number().min(1).max(30).optional().default(7),
    message: Joi.string().max(500).optional()
});

const provisionOrgSchema = Joi.object({
    org_name: Joi.string().min(2).max(100).required(),
    owner_email: Joi.string().email().required(),
    role_id: Joi.string().uuid().optional(), // defaults to owner role
    description: Joi.string().max(500).optional().allow('', null)
});

module.exports = {
    createOrganizationSchema,
    updateOrganizationSchema,
    createMembershipSchema,
    updateMembershipSchema,
    bulkAssignSchema,
    createOrgSchema,
    joinOrgSchema,
    createInvitationSchema,
    provisionOrgSchema
};
