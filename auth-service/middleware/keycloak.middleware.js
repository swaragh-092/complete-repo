
const { getKeycloakService } = require('../config/index');
const logger = require('../utils/logger');

/**
 * Middleware to initialize KeycloakService for the request.
 * Uses cached instances from getKeycloakService() for performance.
 * Attaches the service instance to req.kc.
 * 
 * Usage:
 * router.use(withKeycloak);
 * router.get('/', async (req, res) => {
 *   const users = await req.kc.getAllUser();
 * });
 */
async function withKeycloak(req, res, next) {
  try {
    // Determine realm from header, query, params, user context, or default to 'master'
    const realm = req.headers['x-realm']
      || req.query.realm
      || req.params.realm
      || req.user?.realm
      || 'master';

    // Use cached KeycloakService instance
    const kc = await getKeycloakService(realm);

    // Attach to request object
    req.kc = kc;

    next();
  } catch (error) {
    logger.error('Failed to initialize Keycloak service:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Keycloak service',
      details: error.message
    });
  }
}

module.exports = withKeycloak;
