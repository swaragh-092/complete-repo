// middleware/authorization.middleware.js - Unified Authorization Middleware

const AuthorizationService = require('../services/authorization.service');
const logger = require('../utils/logger');

/**
 * Unified authorization middleware
 * Supports RBAC, ABAC, and ReBAC
 */
const authorize = (options = {}) => {
  const {
    action,
    resourceType,
    resourceIdParam = 'id',
    orgIdParam = 'orgId',
    requireAll = false, // Require all methods (AND) vs any method (OR)
    skipRBAC = false,
    skipABAC = false,
    skipReBAC = false,
    onDenied = null, // Custom denial handler
  } = options;

  return async (req, res, next) => {
    try {
      // Build resource context
      const resource = {
        type: resourceType || req.path.split('/')[1],
        id: req.params[resourceIdParam] || req.body?.id,
        orgId: req.params[orgIdParam] || req.body?.org_id || req.user?.organizations?.[0]?.id,
        attributes: req.body?.attributes || {},
      };

      // Build environment context
      const environment = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: req.method,
        path: req.path,
        query: req.query,
      };

      // Perform authorization check
      const result = await AuthorizationService.checkAccess({
        user: req.user,
        action: action || req.method.toLowerCase(),
        resource,
        environment,
        options: {
          requireAll,
          skipRBAC,
          skipABAC,
          skipReBAC,
        },
      });

      if (!result.allowed) {
        logger.warn('Authorization denied', {
          userId: req.user?.sub,
          email: req.user?.email,
          action,
          resource,
          method: result.method,
          reason: result.reason,
        });

        if (onDenied) {
          return onDenied(req, res, result);
        }

        return res.status(403).json({
          error: 'Access Denied',
          message: result.reason,
          code: 'AUTHORIZATION_DENIED',
          method: result.method,
          resource: {
            type: resource.type,
            id: resource.id,
          },
        });
      }

      // Attach authorization result to request
      req.authorization = result;

      logger.info('Authorization granted', {
        userId: req.user?.sub,
        email: req.user?.email,
        action,
        resource,
        method: result.method,
      });

      next();
    } catch (error) {
      logger.error('Authorization check failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.sub,
      });

      return res.status(500).json({
        error: 'Authorization Error',
        message: 'Failed to perform authorization check',
        code: 'AUTHZ_ERROR',
      });
    }
  };
};

/**
 * RBAC-only authorization
 */
const authorizeRBAC = (permission, options = {}) => {
  return authorize({
    ...options,
    action: permission,
    skipABAC: true,
    skipReBAC: true,
  });
};

/**
 * ABAC-only authorization
 */
const authorizeABAC = (options = {}) => {
  return authorize({
    ...options,
    skipRBAC: true,
    skipReBAC: true,
  });
};

/**
 * ReBAC-only authorization
 */
const authorizeReBAC = (options = {}) => {
  return authorize({
    ...options,
    skipRBAC: true,
    skipABAC: true,
  });
};

/**
 * Require all methods (AND logic)
 */
const authorizeAll = (options = {}) => {
  return authorize({
    ...options,
    requireAll: true,
  });
};

/**
 * Context-aware authorization
 * Allows different authorization strategies based on context
 */
const authorizeContext = (contexts) => {
  return async (req, res, next) => {
    for (const ctx of contexts) {
      const middleware = authorize({
        action: ctx.action,
        resourceType: ctx.resourceType,
        requireAll: ctx.requireAll || false,
        skipRBAC: ctx.skipRBAC || false,
        skipABAC: ctx.skipABAC || false,
        skipReBAC: ctx.skipReBAC || false,
      });

      // Try this context
      let passed = false;
      await new Promise((resolve) => {
        middleware(req, res, (err) => {
          if (!err) passed = true;
          resolve();
        });
      });

      if (passed) {
        return next();
      }
    }

    return res.status(403).json({
      error: 'Access Denied',
      message: 'No authorization context granted access',
      code: 'AUTHORIZATION_DENIED',
    });
  };
};

module.exports = {
  authorize,
  authorizeRBAC,
  authorizeABAC,
  authorizeReBAC,
  authorizeAll,
  authorizeContext,
};








