/**
 * Centralized Constants Configuration
 * 
 * This file contains all application-wide constants to avoid magic strings
 * and ensure consistency across the codebase.
 */

// User Roles
const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    USER: 'user',
    SERVICE_ACCOUNT: 'service_account',
};

// Organization Membership Status
const MEMBER_STATUS = {
    ACTIVE: 'active',
    PENDING: 'pending',
    SUSPENDED: 'suspended',
    INVITED: 'invited',
    LEFT: 'left',
    INACTIVE: 'inactive', // Added for workspace soft delete
};

// Workspace Roles (Context-level access)
const WORKSPACE_ROLES = {
    ADMIN: 'admin',
    EDITOR: 'editor',
    VIEWER: 'viewer',
};

// Invitation Status (Org and Workspace invitations)
const INVITATION_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    EXPIRED: 'expired',
    REVOKED: 'revoked',
};

// Audit Log Actions (Standardized)
const AUDIT_ACTIONS = {
    // Auth
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
    LOGIN_FAILED: 'LOGIN_FAILED',

    // User Management
    USER_CREATE: 'USER_CREATE',
    USER_UPDATE: 'USER_UPDATE',
    USER_DELETE: 'USER_DELETE',

    // Organization
    ORG_CREATE: 'ORG_CREATE',
    ORG_UPDATE: 'ORG_UPDATE',
    ORG_DELETE: 'ORG_DELETE',
    ORG_JOIN: 'ORG_JOIN',

    // Workspace
    WORKSPACE_CREATE: 'WORKSPACE_CREATE',
    WORKSPACE_UPDATE: 'WORKSPACE_UPDATE',
    WORKSPACE_DELETE: 'WORKSPACE_DELETE',
    WORKSPACE_MEMBER_ADD: 'WORKSPACE_MEMBER_ADD',
    WORKSPACE_MEMBER_REMOVE: 'WORKSPACE_MEMBER_REMOVE',
    WORKSPACE_MEMBER_ROLE_CHANGE: 'WORKSPACE_MEMBER_ROLE_CHANGE',
    WORKSPACE_INVITE_SEND: 'WORKSPACE_INVITE_SEND',
    WORKSPACE_INVITE_ACCEPT: 'WORKSPACE_INVITE_ACCEPT',

    // Security
    PASSWORD_CHANGE: 'PASSWORD_CHANGE',
    MFA_ENABLE: 'MFA_ENABLE',
    MFA_DISABLE: 'MFA_DISABLE',
};

// Resource Types for Authorization
const RESOURCE_TYPES = {
    USER: 'USER',
    ORGANIZATION: 'ORGANIZATION',
    ROLE: 'ROLE',
    PERMISSION: 'PERMISSION',
    CLIENT: 'CLIENT',
    WORKSPACE: 'WORKSPACE',
    WORKSPACE_INVITATION: 'WORKSPACE_INVITATION',
};

// System Limits (Configurable via ENV)
const SYSTEM_LIMITS = {
    MAX_WORKSPACES_PER_ORG: parseInt(process.env.MAX_WORKSPACES_PER_ORG || '5', 10),
    INVITATION_EXPIRY_DAYS: 7,
};

module.exports = {
    ROLES,
    MEMBER_STATUS,
    WORKSPACE_ROLES,
    INVITATION_STATUS,
    AUDIT_ACTIONS,
    RESOURCE_TYPES,
    SYSTEM_LIMITS,
};
