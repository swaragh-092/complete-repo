'use strict';

const Joi = require('joi');
const { EMAIL_TYPES, SCOPES, TYPE_SCOPE_MAP } = require('../config/constants');
const config = require('../config');

// ── Per-Type Data Schemas ──────────────────────────────────────────────────
const schemas = {
    [EMAIL_TYPES.CLIENT_REQUEST]: Joi.object({
        adminName: Joi.string().required(),
        clientName: Joi.string().required(),
        developerEmail: Joi.string().email().required(),
        clientKey: Joi.string().optional(),
        redirectUrl: Joi.string().uri().optional(),
        approveUrl: Joi.string().uri().optional(),
        description: Joi.string().allow('').optional(),
        reviewUrl: Joi.string().uri().optional(),
    }).options({ stripUnknown: true }),

    [EMAIL_TYPES.CLIENT_APPROVED]: Joi.object({
        developerName: Joi.string().required(),
        clientName: Joi.string().required(),
        clientId: Joi.string().required(),
        clientSecret: Joi.string().required(),
        dashboardLink: Joi.string().uri().optional(),
    }).options({ stripUnknown: true }),

    [EMAIL_TYPES.CLIENT_REJECTED]: Joi.object({
        developerName: Joi.string().required(),
        clientName: Joi.string().required(),
        rejectionReason: Joi.string().required(),
    }).options({ stripUnknown: true }),

    [EMAIL_TYPES.ORGANIZATION_INVITATION]: Joi.object({
        inviterName: Joi.string().required(),
        organizationName: Joi.string().required(),
        role: Joi.string().required(),
        invitationLink: Joi.string().uri().required(),
        expiresAt: Joi.string().isoDate().optional(),
    }).options({ stripUnknown: true }),

    [EMAIL_TYPES.WORKSPACE_INVITATION]: Joi.object({
        workspaceName: Joi.string().required(),
        organizationName: Joi.string().required(),
        inviterEmail: Joi.string().email().required(),
        role: Joi.string().required(),
        invitationLink: Joi.string().uri().required(),
    }).options({ stripUnknown: true }),

    [EMAIL_TYPES.ORGANIZATION_CREATED]: Joi.object({
        userName: Joi.string().required(),
        organizationName: Joi.string().required(),
        dashboardLink: Joi.string().uri().optional(),
    }).options({ stripUnknown: true }),

    [EMAIL_TYPES.NEW_DEVICE_LOGIN]: Joi.object({
        userName: Joi.string().required(),
        device: Joi.string().required(),
        ip: Joi.string().ip().required(),
        time: Joi.string().required(),
        location: Joi.string().optional(),
    }).options({ stripUnknown: true }),

    [EMAIL_TYPES.HIGH_RISK_LOGIN]: Joi.object({
        userName: Joi.string().required(),
        ip: Joi.string().ip().optional(),
        time: Joi.string().optional(),
        location: Joi.string().optional(),
        riskScore: Joi.number().optional(),
        riskLevel: Joi.string().optional(),
        secureUrl: Joi.string().uri().optional(),
    }).options({ stripUnknown: true }),

    [EMAIL_TYPES.SECURITY_ALERT]: Joi.object({
        userName: Joi.string().required(),
        alertTitle: Joi.string().required(),
        alertMessage: Joi.string().required(),
    }).options({ stripUnknown: true }),
};

// ── Main Send Email Schema ─────────────────────────────────────────────────
const sendEmailSchema = Joi.object({
    type: Joi.string()
        .valid(...Object.values(EMAIL_TYPES))
        .required()
        .messages({
            'any.only': `Invalid email type. Must be one of: ${Object.values(EMAIL_TYPES).join(', ')}`,
        }),
    to: Joi.string().email().required(),
    data: Joi.object().required(),

    // Multi-tenant tracking (all optional for backwards compatibility)
    scope: Joi.string().valid(...Object.values(SCOPES)).optional(),
    org_id: Joi.string().uuid().optional(),
    user_id: Joi.string().uuid().optional(),
    client_key: Joi.string().max(50).trim().optional(),
    service_name: Joi.string().max(50).trim().optional(),

    // Scheduling (optional)
    delay: Joi.number().integer().min(1000).max(config.MAX_DELAY_MS).optional()
        .messages({
            'number.min': 'Delay must be at least 1 second (1000ms)',
            'number.max': `Delay cannot exceed ${config.MAX_DELAY_MS / 86400000} days`,
        }),
}).custom((value, helpers) => {
    // Auto-detect scope if not provided
    const scope = value.scope || TYPE_SCOPE_MAP[value.type] || SCOPES.SYSTEM;
    value.scope = scope; // Assign computed scope back

    // Conditional validation based on scope
    if (scope === SCOPES.ORGANIZATION && !value.org_id) {
        return helpers.message('org_id is required for organization-scoped emails');
    }
    if (scope === SCOPES.USER && !value.user_id) {
        return helpers.message('user_id is required for user-scoped emails');
    }

    return value;
});

// ── Reusable validators ────────────────────────────────────────────────────
const validEmail = Joi.string().email().required();

module.exports = {
    schemas,
    sendEmailSchema,
    validEmail,
};
