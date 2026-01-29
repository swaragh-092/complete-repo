const express = require('express');
const asyncHandler = require('../../middleware/asyncHandler');
const { authMiddleware } = require('../../middleware/authMiddleware');
const withKeycloak = require('../../middleware/keycloak.middleware');
const { AppError } = require('../../middleware/errorHandler');
const ResponseHandler = require('../../utils/responseHandler');
const { getKeycloakService } = require('../../config');

const router = express.Router();

router.use(authMiddleware);
router.use(withKeycloak);

// GET /api/admin/applications
router.get('/', asyncHandler(async (req, res) => {
    const { realm } = req.query;
    // If realm is provided in query, use it, otherwise use the one from token or default
    const targetRealm = realm || req.user.realm || 'master';

    // Re-initialize keycloak service with target realm if needed
    // Note: withKeycloak middleware initializes req.kc with 'master' or param.
    // We might need to manually instantiate if we want to switch realms dynamically based on query.
    // But let's assume req.kc is sufficient if we pass ?realm=... and middleware handles it?
    // Actually withKeycloak uses req.params.realm.

    // Let's just use req.kc.getClients() but we need to ensure req.kc is pointing to the right realm.
    // If this route is mounted at /api/admin/applications, there is no :realm param.
    // So withKeycloak might default to 'master'.

    // Use cached KeycloakService from config
    const kc = await getKeycloakService(targetRealm);

    const clients = await kc.getClients();

    // Filter and format as "Applications"
    // We might want to filter out standard Keycloak clients like 'account', 'admin-cli', etc.
    // or just return them all with metadata.

    const applications = clients.map(client => ({
        id: client.id,
        name: client.name || client.clientId,
        clientId: client.clientId,
        description: client.description,
        baseUrl: client.baseUrl,
        enabled: client.enabled,
        protocol: client.protocol,
        realm: targetRealm
    }));

    return ResponseHandler.success(res, applications, 'Applications retrieved successfully');
}));

module.exports = router;
