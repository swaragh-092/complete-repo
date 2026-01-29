/**
 * routes/clients/index.js - Client Registration Domain Router
 * 
 * Handles client registration request workflow:
 * - Submit client registration requests
 * - Check request status
 * - Admin approval/rejection
 * 
 * Mount point: /clients
 */

const clientRequestsRouter = require('./client-requests.routes');

module.exports = clientRequestsRouter;
