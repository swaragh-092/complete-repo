/**
 * routes/admin/index.js - Admin API Router
 * 
 * Aggregates all Keycloak Admin API routes:
 * - Realms: CRUD operations on Keycloak realms
 * - Clients: CRUD operations on Keycloak clients within a realm
 * - Users: CRUD operations on Keycloak users within a realm
 * - Roles: CRUD operations on Keycloak realm roles
 * 
 * Mount point: /api/admin
 */

const express = require('express');
const logger = require('../../utils/logger');
const router = express.Router();

router.use((req, res, next) => {
    logger.info('Admin Router Hit:', req.method, req.originalUrl, req.path);
    next();
});

// Sub-domain routers
const realmsRouter = require('./realms.routes');
const clientsRouter = require('./clients.routes');
const usersRouter = require('./users.routes');
const rolesRouter = require('./roles.routes');
const idpRouter = require('./identity-providers.routes');
const themesRouter = require('./themes.routes');
const clientMappersRouter = require('./client-mappers.routes');
const securityRouter = require('./security.routes');
const analyticsRouter = require('./analytics.routes');
const applicationsRouter = require('./applications.routes');

// Applications routes (Global/Query-based)
router.use('/applications', applicationsRouter);



// Realm management routes
router.use('/realms', realmsRouter);

// Realm-specific sub-resources
// Note: :realm parameter is handled by mergeParams: true in sub-routers
router.use('/:realm/clients', clientsRouter);
router.use('/:realm/users', usersRouter);
router.use('/:realm/roles', rolesRouter);
router.use('/:realm/identity-provider', idpRouter);
router.use('/:realm/themes', themesRouter);
router.use('/:realm/clients/:clientId/mappers', clientMappersRouter);
router.use('/:realm/security', securityRouter);
router.use('/:realm/analytics', analyticsRouter);

module.exports = router;
