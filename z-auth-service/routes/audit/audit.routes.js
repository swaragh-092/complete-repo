// routes/audit.route.js - Audit Log API Routes

const express = require('express');
const { authMiddleware } = require('../../middleware/authMiddleware');
const AuditService = require('../../services/audit.service');
const asyncHandler = require('../../middleware/asyncHandler');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /account/audit-logs
 * Get audit logs for the authenticated user
 * Query params: page, limit, action, startDate, endDate, status, search
 */
router.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const userId = req.user.sub || req.user.keycloak_id;
    const {
      page = 1,
      limit = 50,
      action = null,
      startDate = null,
      endDate = null,
      status = null,
      search = null,
    } = req.query;

    const result = await AuditService.getLogs({
      userId,
      orgId: req.user.organizations?.[0]?.id || null,
      clientId: req.user.client_id || null,
      action,
      startDate,
      endDate,
      status,
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });

    res.json({
      success: true,
      ...result,
    });
  })
);

/**
 * GET /account/login-history
 * Get user's login history
 */
router.get(
  '/login-history',
  asyncHandler(async (req, res) => {
    const userId = req.user.sub || req.user.keycloak_id;
    const limit = parseInt(req.query.limit) || 50;

    const history = await AuditService.getUserLoginHistory(userId, limit);

    res.json({
      success: true,
      history,
      count: history.length,
    });
  })
);

/**
 * GET /account/security-events
 * Get user's security-related events
 */
router.get(
  '/security-events',
  asyncHandler(async (req, res) => {
    const userId = req.user.sub || req.user.keycloak_id;
    const limit = parseInt(req.query.limit) || 50;

    const events = await AuditService.getUserSecurityEvents(userId, limit);

    res.json({
      success: true,
      events,
      count: events.length,
    });
  })
);

/**
 * GET /account/sessions/stats
 * Get session statistics for the user
 */
router.get(
  '/sessions/stats',
  asyncHandler(async (req, res) => {
    const userId = req.user.sub || req.user.keycloak_id;

    // Get session-related audit logs
    const sessionLogs = await AuditService.getLogs({
      userId,
      action: 'SESSION',
      limit: 100,
    });

    const stats = {
      totalSessions: sessionLogs.data.filter(log => log.action === 'SESSION_CREATE').length,
      activeSessions: sessionLogs.data.filter(log => log.action === 'SESSION_CREATE' && log.details?.status === 'SUCCESS').length,
      terminatedSessions: sessionLogs.data.filter(log => log.action === 'SESSION_TERMINATE').length,
      lastLogin: sessionLogs.data.find(log => log.action === 'AUTH_LOGIN')?.created_at || null,
      lastLogout: sessionLogs.data.find(log => log.action === 'AUTH_LOGOUT')?.created_at || null,
    };

    res.json({
      success: true,
      stats,
    });
  })
);

module.exports = router;









