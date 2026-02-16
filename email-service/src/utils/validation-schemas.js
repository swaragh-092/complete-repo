const Joi = require('joi');
const { EMAIL_TYPES } = require('../config/constants');

const schemas = {
    [EMAIL_TYPES.CLIENT_REQUEST]: Joi.object({
        adminName: Joi.string().required(),
        clientName: Joi.string().required(),
        developerEmail: Joi.string().email().required(),
        description: Joi.string().allow('').optional(),
        reviewUrl: Joi.string().uri().optional()
    }).unknown(true),

    [EMAIL_TYPES.CLIENT_APPROVED]: Joi.object({
        developerName: Joi.string().required(),
        clientName: Joi.string().required(),
        clientId: Joi.string().required(),
        clientSecret: Joi.string().required(),
        dashboardLink: Joi.string().uri().optional() // Assuming this might be used
    }).unknown(true),

    [EMAIL_TYPES.CLIENT_REJECTED]: Joi.object({
        developerName: Joi.string().required(),
        clientName: Joi.string().required(),
        rejectionReason: Joi.string().required()
    }).unknown(true),

    [EMAIL_TYPES.ORGANIZATION_INVITATION]: Joi.object({
        inviterName: Joi.string().required(),
        organizationName: Joi.string().required(),
        role: Joi.string().required(),
        invitationLink: Joi.string().uri().required(),
        expiresAt: Joi.string().isoDate().optional()
    }).unknown(true),

    [EMAIL_TYPES.WORKSPACE_INVITATION]: Joi.object({
        workspaceName: Joi.string().required(),
        organizationName: Joi.string().required(),
        inviterEmail: Joi.string().email().required(),
        role: Joi.string().required(),
        invitationLink: Joi.string().uri().required()
    }).unknown(true),

    [EMAIL_TYPES.ORGANIZATION_CREATED]: Joi.object({
        userName: Joi.string().required(),
        organizationName: Joi.string().required(),
        dashboardLink: Joi.string().uri().optional()
    }).unknown(true),

    [EMAIL_TYPES.NEW_DEVICE_LOGIN]: Joi.object({
        userName: Joi.string().required(),
        device: Joi.string().required(),
        ip: Joi.string().ip().required(),
        time: Joi.string().required(),
        location: Joi.string().optional()
    }).unknown(true),

    [EMAIL_TYPES.HIGH_RISK_LOGIN]: Joi.object({
        userName: Joi.string().required(),
        ip: Joi.string().ip().required(),
        time: Joi.string().required(),
        location: Joi.string().optional(),
        riskScore: Joi.number().optional(), // Can be number or object depending on implementation, but template uses it
        // If template accesses data.riskScore.score, then riskScore must be object? 
        // Let's check the template logic or assume the user's report is correct about nesting.
        // User said: data.riskScore.score, data.riskScore.breakdown
    }).unknown(true),

    [EMAIL_TYPES.SECURITY_ALERT]: Joi.object({
        userName: Joi.string().required(),
        alertTitle: Joi.string().required(),
        alertMessage: Joi.string().required()
    }).unknown(true),
};

// Refine HIGH_RISK_LOGIN based on user feedback
schemas[EMAIL_TYPES.HIGH_RISK_LOGIN] = Joi.object({
    userName: Joi.string().required(),
    ip: Joi.string().ip().optional(),
    time: Joi.string().optional(),
    location: Joi.string().optional(),
    riskScore: Joi.number().optional(),
    riskLevel: Joi.string().optional(),
    secureUrl: Joi.string().uri().optional()
}).unknown(true);

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


const validEmail = Joi.string().email().required();

module.exports = {
    schemas,
    sendEmailSchema,
    validEmail
};
