'use strict';

/**
 * Email Types Registry
 * Defines all supported email types for type-safe usage
 */
const EMAIL_TYPES = {
    CLIENT_REQUEST: 'CLIENT_REQUEST',
    CLIENT_APPROVED: 'CLIENT_APPROVED',
    CLIENT_REJECTED: 'CLIENT_REJECTED',
    ORGANIZATION_INVITATION: 'ORGANIZATION_INVITATION',
    WORKSPACE_INVITATION: 'WORKSPACE_INVITATION',
    ORGANIZATION_CREATED: 'ORGANIZATION_CREATED',
    NEW_DEVICE_LOGIN: 'NEW_DEVICE_LOGIN',
    HIGH_RISK_LOGIN: 'HIGH_RISK_LOGIN',
    SECURITY_ALERT: 'SECURITY_ALERT',
};

/**
 * Scope Types
 * Categorizes emails by context level
 * Using string values (not DB ENUM) for easy extensibility
 */
const SCOPES = {
    SYSTEM: 'system',           // Platform-level (admin panel, CLI tools)
    ORGANIZATION: 'organization', // Org-scoped (invitations, workspace)
    USER: 'user',               // User-specific (login alerts, security)
};

/**
 * Auto-Scope Detection Map
 * Maps each email type to its natural scope
 * Used when caller does not explicitly provide a scope
 */
const TYPE_SCOPE_MAP = {
    [EMAIL_TYPES.CLIENT_REQUEST]: SCOPES.SYSTEM,
    [EMAIL_TYPES.CLIENT_APPROVED]: SCOPES.SYSTEM,
    [EMAIL_TYPES.CLIENT_REJECTED]: SCOPES.SYSTEM,
    [EMAIL_TYPES.ORGANIZATION_INVITATION]: SCOPES.ORGANIZATION,
    [EMAIL_TYPES.WORKSPACE_INVITATION]: SCOPES.ORGANIZATION,
    [EMAIL_TYPES.ORGANIZATION_CREATED]: SCOPES.ORGANIZATION,
    [EMAIL_TYPES.NEW_DEVICE_LOGIN]: SCOPES.USER,
    [EMAIL_TYPES.HIGH_RISK_LOGIN]: SCOPES.USER,
    [EMAIL_TYPES.SECURITY_ALERT]: SCOPES.USER,
};

/**
 * Rate Limiting Defaults
 */
const RATE_LIMITS = {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
};

module.exports = {
    EMAIL_TYPES,
    SCOPES,
    TYPE_SCOPE_MAP,
    RATE_LIMITS,
};
