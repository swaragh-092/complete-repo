/**
 * routes/audit/index.js - Audit Domain Router
 * 
 * Handles audit logging and history:
 * - Audit logs retrieval
 * - Login history
 * - Security events
 * - Session statistics
 * 
 * Mount point: /auth/audit
 */

const auditRouter = require('./audit.routes');

module.exports = auditRouter;
