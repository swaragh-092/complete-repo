// middleware/auditMiddleware.js - Enterprise Audit Logging Middleware

const AuditService = require('../services/audit.service');
const auditConfig = require('../config/auditConfig');
const DeviceFingerprintService = require('../services/device-fingerprint.service');
const { ROLES, AUDIT_ACTIONS, RESOURCE_TYPES } = require('../config/constants');

/**
 * Main audit middleware factory
 * Usage: auditMiddleware('USER_LOGIN') or auditMiddleware({ action: 'USER_LOGIN', entityType: 'USER' })
 * 
 * @param {string|Object} actionNameOrOptions - Action name string or options object
 * @param {string} [actionNameOrOptions.action] - Action name (e.g., 'USER_LOGIN')
 * @param {string} [actionNameOrOptions.entityType] - Entity type (e.g., 'USER', 'ROLE')
 * @param {Function} [actionNameOrOptions.getEntityId] - Function to extract entity ID from req
 * @param {boolean} [actionNameOrOptions.logSuccess] - Whether to log successful requests
 * @param {boolean} [actionNameOrOptions.logErrors] - Whether to log failed requests
 * @param {string} [actionNameOrOptions.category] - Override category
 * @param {string} [actionNameOrOptions.severity] - Override severity
 */
const auditMiddleware = (actionNameOrOptions = {}) => {
  // Normalize options
  const options = typeof actionNameOrOptions === 'string'
    ? { action: actionNameOrOptions }
    : actionNameOrOptions;

  const {
    action,
    entityType = null,
    getEntityId = (req) => req.params.id || req.body?.id || null,
    logSuccess = true,
    logErrors = true,
    category = null,
    severity = null,
  } = options;

  return async (req, res, next) => {
    // Skip logging if audit is disabled
    if (!auditConfig.enabled) {
      return next();
    }

    // Skip logging for excluded paths
    if (auditConfig.excludePaths.some(path => req.path.includes(path))) {
      return next();
    }

    const startTime = Date.now();
    const requestId = req.correlationId || req.requestId || null;
    const correlationId = req.correlationId || null;
    const traceId = req.traceId || null;
    const spanId = req.spanId || null;

    // Extract user information
    const userId = req.user?.sub || req.user?.keycloak_id || null;
    const orgId = req.user?.organizations?.[0]?.id || null;
    const clientId = req.user?.client_id || null;
    const sessionId = req.session?.id || req.headers['x-session-id'] || null;

    // Extract entity information
    const entityId = getEntityId(req);

    // Extract request information
    const sourceIP = req.ip ||
      req.connection?.remoteAddress ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      null;
    const destinationIP = req.headers['x-forwarded-for']?.split(',')[1]?.trim() || null;
    const userAgent = req.get('user-agent') || null;

    // Extract device information (if available from trusted devices)
    let deviceId = null;
    let deviceInfo = {};
    if (req.deviceFingerprint) {
      deviceId = req.deviceFingerprint;
    }

    // Extract privilege level from user
    let privilegeLevel = ROLES.USER.toUpperCase();
    if (req.user?.roles) {
      if (req.user.roles.some(r => r.toLowerCase().includes(ROLES.SUPER_ADMIN))) {
        privilegeLevel = 'SUPER_ADMIN'; // Keeping DB convention for now
      } else if (req.user.roles.some(r => r.toLowerCase().includes(ROLES.ADMIN))) {
        privilegeLevel = 'ADMIN';
      }
    }

    // Determine actor type
    let actorType = 'USER';
    if (req.headers['x-api-key'] || req.headers['authorization']?.startsWith('Bearer ')) {
      actorType = 'API';
    } else if (req.user?.service_account) {
      actorType = 'SERVICE_ACCOUNT';
    }

    // Determine auth method
    let authMethod = 'UNKNOWN';
    if (req.headers['authorization']) {
      if (req.headers['authorization'].startsWith('Bearer ')) {
        authMethod = 'JWT';
      } else if (req.headers['authorization'].startsWith('Basic ')) {
        authMethod = 'PASSWORD';
      }
    }
    if (req.query?.provider) {
      authMethod = 'OAUTH';
    }

    // Listen for response finish event
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;

      // Determine status
      let status = 'SUCCESS';
      if (statusCode >= 500) {
        status = 'ERROR';
      } else if (statusCode >= 400) {
        status = 'FAILURE';
      }

      // Check if we should log this request
      const shouldLog = (status === 'SUCCESS' && logSuccess) ||
        (status !== 'SUCCESS' && logErrors);

      if (!shouldLog) {
        return;
      }

      // Determine action name
      const finalAction = action ||
        `${req.method}_${req.path.replace(/\//g, '_').toUpperCase()}`;

      // Extract error message if available
      let errorMessage = null;
      if (status !== 'SUCCESS' && res.locals.error) {
        errorMessage = res.locals.error.message || res.locals.error;
      }

      // Prepare metadata
      const metadata = {
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        statusCode,
        duration,
        ...(req.query && Object.keys(req.query).length > 0 && { query: req.query }),
        ...(errorMessage && { error: errorMessage }),
        ...(req.body && Object.keys(req.body).length > 0 && {
          body: AuditService.sanitizeData(req.body)
        }),
      };

      // Log the audit event with all enterprise fields
      AuditService.log({
        // Core Identifiers
        action: finalAction,
        userId,
        orgId,
        clientId,
        sessionId,
        requestId,
        correlationId,

        // Action Context
        category,
        severity,
        status,
        message: errorMessage || `${finalAction} - ${status}`,
        metadata,

        // Environment & System Context
        sourceIP,
        destinationIP,
        userAgent,
        deviceId,
        traceId,
        spanId,

        // Security & Compliance
        actorType,
        affectedEntityType: entityType || (entityId ? 'UNKNOWN' : null),
        affectedEntityId: entityId,
        authMethod,
        privilegeLevel,

        // Operational Metadata
        durationMs: duration,
        responseCode: statusCode,
      }).catch(err => {
        // Don't log audit errors to avoid infinite loops
        // Only log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Audit logging error (silent):', err.message);
        }
      });
    });

    // Continue to next middleware
    next();
  };
};

/**
 * Convenience middleware for authentication actions
 */
const auditAuth = (action) => {
  return auditMiddleware({
    action: `AUTH_${action}`,
    entityType: RESOURCE_TYPES.USER,
    getEntityId: (req) => req.user?.sub || req.user?.keycloak_id || null,
    category: 'AUTH',
  });
};

/**
 * Convenience middleware for profile updates
 */
const auditProfile = (action) => {
  return auditMiddleware({
    action: `PROFILE_${action}`,
    entityType: RESOURCE_TYPES.USER,
    getEntityId: (req) => req.user?.sub || req.user?.keycloak_id || null,
    category: 'USER_MANAGEMENT',
  });
};

/**
 * Convenience middleware for security actions
 */
const auditSecurity = (action) => {
  return auditMiddleware({
    action: `SECURITY_${action}`,
    entityType: RESOURCE_TYPES.USER,
    getEntityId: (req) => req.user?.sub || req.user?.keycloak_id || null,
    category: 'SECURITY',
    severity: 'WARNING',
  });
};

/**
 * Convenience middleware for session actions
 */
const auditSession = (action) => {
  return auditMiddleware({
    action: `SESSION_${action}`,
    entityType: 'SESSION',
    getEntityId: (req) => req.params.id || req.body?.sessionId || null,
    category: 'AUTH',
  });
};

/**
 * Convenience middleware for device actions
 */
const auditDevice = (action) => {
  return auditMiddleware({
    action: `DEVICE_${action}`,
    entityType: 'DEVICE',
    getEntityId: (req) => req.params.id || req.body?.deviceId || null,
    category: 'SECURITY',
  });
};

/**
 * Convenience middleware for organization actions
 */
const auditOrganization = (action) => {
  return auditMiddleware({
    action: `ORG_${action}`,
    entityType: RESOURCE_TYPES.ORGANIZATION,
    getEntityId: (req) => req.params.orgId || req.body?.orgId || req.user?.organizations?.[0]?.id || null,
    category: 'ADMIN',
  });
};

/**
 * Convenience middleware for role actions
 */
const auditRole = (action) => {
  return auditMiddleware({
    action: `ROLE_${action}`,
    entityType: RESOURCE_TYPES.ROLE,
    getEntityId: (req) => req.params.id || req.params.roleId || req.body?.roleId || req.body?.role_name || null,
    category: 'AUTHORIZATION',
  });
};

/**
 * Convenience middleware for permission actions
 */
const auditPermission = (action) => {
  return auditMiddleware({
    action: `PERMISSION_${action}`,
    entityType: RESOURCE_TYPES.PERMISSION,
    getEntityId: (req) => req.params.id || req.params.permissionId || req.body?.permissionId || req.body?.permission_name || null,
    category: 'AUTHORIZATION',
  });
};

/**
 * Convenience middleware for user management actions
 */
const auditUser = (action) => {
  return auditMiddleware({
    action: `USER_${action}`,
    entityType: RESOURCE_TYPES.USER,
    getEntityId: (req) => req.params.userId || req.params.id || req.body?.userId || req.body?.id || null,
    category: 'USER_MANAGEMENT',
  });
};

module.exports = {
  auditMiddleware,
  auditAuth,
  auditProfile,
  auditSecurity,
  auditSession,
  auditDevice,
  auditOrganization,
  auditRole,
  auditPermission,
  auditUser,
};
