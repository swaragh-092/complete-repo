const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { KEYCLOAK_URL, FRONTEND_AUTH_URL } = require('../config');
const logger = require('../utils/logger');

// Cache clients per realm
const clientCache = new Map();

function getJwksClient(realm) {
  if (!clientCache.has(realm)) {
    const client = jwksClient({
      jwksUri: `${KEYCLOAK_URL}/realms/${realm}/protocol/openid-connect/certs`,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 86400000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
    clientCache.set(realm, client);
  }
  return clientCache.get(realm);
}

async function verifyJwt(token, realm) {
  try {
    logger.debug(`Verifying JWT token for realm: ${realm}`);

    const client = getJwksClient(realm);

    const getKey = (header, callback) => {
      logger.debug(`Fetching signing key for realm: ${realm}, kid: ${header.kid}`);

      client.getSigningKey(header.kid, (err, key) => {
        if (err) {
          logger.error(`Error fetching signing key for realm ${realm}`, { error: err.message });
          return callback(err);
        }

        const signingKey = key?.publicKey || key?.rsaPublicKey;
        callback(null, signingKey);
      });
    };

    return new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {
        issuer: `${FRONTEND_AUTH_URL}/realms/${realm}`, // Use browser-facing URL to match token issuer
        algorithms: ['RS256'],
      }, (err, decoded) => {
        if (err) {
          logger.error(`JWT verification failed for realm ${realm}`, { error: err.message });
          reject(err);
        } else {
          logger.debug(`JWT verified successfully for realm ${realm}`, {
            sub: decoded.sub,
            azp: decoded.azp,
            hasAllClaims: !!decoded.sub && !!decoded.azp
          });
          resolve(decoded);
        }
      });
    });

  } catch (e) {
    logger.error(`JWT verification failed for realm ${realm}`, { error: e.message });
    throw e;
  }
}

module.exports = { verifyJwt };

