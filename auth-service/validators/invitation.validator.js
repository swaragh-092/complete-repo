/**
 * Invitation Validation Schemas
 * Extracted from routes/organizations/onboarding.routes.js
 */
const { Joi, uuid, email, description } = require('./common');

// Create Invitation
const createInvitationSchema = Joi.object({
    org_id: uuid.required(),
    invited_email: email.required(),
    role_id: uuid.required(),
    expires_in_days: Joi.number().integer().min(1).max(30).optional().default(7),
    message: description.optional(),
});

// Accept Invitation
const acceptInvitationSchema = Joi.object({
    invitation_code: Joi.string().required(),
});

// Revoke Invitation
const revokeInvitationSchema = Joi.object({
    invitation_id: uuid.required(),
});

module.exports = {
    createInvitationSchema,
    acceptInvitationSchema,
    revokeInvitationSchema,
};
