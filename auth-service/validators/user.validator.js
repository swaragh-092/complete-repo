/**
 * User Validation Schemas
 * Extracted from routes/admin/users.routes.js
 */
const { Joi, email, password, username, shortName, uuid } = require('./common');

// Create User
const createUserSchema = Joi.object({
    username: username.required(),
    email: email.required(),
    firstName: shortName.required(),
    lastName: shortName.required(),
    password: password.required(),
    org_id: Joi.string().alphanum().optional(),
    enabled: Joi.boolean().optional().default(true),
});

// Update User
const updateUserSchema = Joi.object({
    username: username.optional(),
    email: email.optional(),
    firstName: shortName.optional(),
    lastName: shortName.optional(),
    enabled: Joi.boolean().optional(),
    org_id: Joi.string().alphanum().optional(),
    attributes: Joi.object().optional(),
}).min(1);

// Password Reset (by admin)
const passwordResetSchema = Joi.object({
    newPassword: password.required(),
    temporary: Joi.boolean().optional().default(false),
});

// Password Set
const passwordSetSchema = Joi.object({
    password: password.required(),
    temporary: Joi.boolean().optional().default(false),
});

// Validate Current Password
const validatePasswordSchema = Joi.object({
    username: Joi.string().required(),
    currentPassword: Joi.string().required(),
    clientId: Joi.string().optional(),
});

// Update User Attributes
const updateAttributesSchema = Joi.object({
    attributes: Joi.object().required(),
});

// User ID Param
const userIdParamSchema = Joi.object({
    userId: uuid.required(),
});

// Update Profile
const updateProfileSchema = Joi.object({
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().max(50).allow("", null).optional(),
    email: email.required(),
    designation: Joi.string().max(100).allow("", null).optional(),
    department: Joi.string().max(100).allow("", null).optional(),
    mobile: Joi.string().max(20).allow("", null).optional(),
    gender: Joi.string().valid("male", "female", "other", "prefer_not_to_say", "", null).allow("", null).optional(),
    bio: Joi.string().max(500).allow("", null).optional(),
    phone: Joi.string().max(20).allow("", null).optional(),
    avatar: Joi.string().allow("", null).optional(),
    timezone: Joi.string().allow("", null).optional(),
    locale: Joi.string().allow("", null).optional(),
}).unknown(true);

// Update Security Settings
const updateSecuritySchema = Joi.object({
    mfaEnabled: Joi.boolean().optional(),
    loginNotifications: Joi.boolean().optional(),
    suspiciousActivityAlerts: Joi.boolean().optional(),
    sessionTimeout: Joi.boolean().optional(),
    passwordExpiry: Joi.date().iso().optional(),
    trustedDevices: Joi.string().optional(),
    locale: Joi.string().valid("en", "es", "fr", "de", "zh", "ja", "pt", "it").optional(),
});

// Change Password
const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().min(4).required(),
    newPassword: password.required(),
    confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
}).with("newPassword", "confirmNewPassword");

module.exports = {
    createUserSchema,
    updateUserSchema,
    passwordResetSchema,
    passwordSetSchema,
    validatePasswordSchema,
    updateAttributesSchema,
    userIdParamSchema,
    updateProfileSchema,
    updateSecuritySchema,
    changePasswordSchema
};
