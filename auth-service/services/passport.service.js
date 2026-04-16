const jwt = require('jsonwebtoken');
const passport = require('passport');
const OpenIdConnectStrategy = require('passport-openidconnect');
const { KEYCLOAK_URL, FRONTEND_AUTH_URL, loadClients } = require('../config');
const { verifyJwt } = require('./jwt.service');
const { UserMetadata, TenantMapping } = require('../config/database');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

const passportStrategies = {};

/**
 * Detect identity provider from issuer and token claims
 */
function detectProvider(issuer, claims) {
  if (claims.identity_provider) {
    return claims.identity_provider;
  }

  if (issuer.includes('accounts.google.com')) return 'google';
  if (issuer.includes('login.microsoftonline.com')) return 'microsoft';
  if (issuer.includes('github.com')) return 'github';

  return 'keycloak';
}

async function getPassportStrategy(clientKey) {
  if (!passportStrategies[clientKey]) {
    const clients = await loadClients();
    const client = clients[clientKey];
    if (!client) throw new AppError(`Client not found: ${clientKey}`, 404, 'CLIENT_NOT_FOUND');

    logger.debug('Initializing Passport strategy', { clientKey, callbackUrl: client.callback_url });
    console.log('🔧 PASSPORT CONFIG:', {
      issuer: `${FRONTEND_AUTH_URL}/realms/${client.realm}`,
      authorizationURL: `${FRONTEND_AUTH_URL}/realms/${client.realm}/protocol/openid-connect/auth`,
      tokenURL: `${KEYCLOAK_URL}/realms/${client.realm}/protocol/openid-connect/token`,
      callbackURL: client.callback_url,
      clientID: client.client_id,
      clientSecretLength: client.client_secret?.length || 0
    });

    passportStrategies[clientKey] = new OpenIdConnectStrategy(
      {
        issuer: `${FRONTEND_AUTH_URL}/realms/${client.realm}`,
        authorizationURL: `${FRONTEND_AUTH_URL}/realms/${client.realm}/protocol/openid-connect/auth`,
        tokenURL: `${KEYCLOAK_URL}/realms/${client.realm}/protocol/openid-connect/token`,
        userInfoURL: `${KEYCLOAK_URL}/realms/${client.realm}/protocol/openid-connect/userinfo`,
        clientID: client.client_id,
        clientSecret: client.client_secret,
        callbackURL: client.callback_url,
        scope: ['openid', 'profile', 'email'],
        skipUserProfile: true, // We decode ID token instead - avoids issuer mismatch on internal userinfo call
      },
      async (issuer, profile, context, idToken, accessToken, refreshToken, params, done) => {
        console.log('🎫 PASSPORT CALLBACK RECEIVED:', {
          issuer,
          hasProfile: !!profile,
          hasIdToken: !!idToken,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          paramsKeys: Object.keys(params || {})
        });
        try {
          const keycloakSessionId = params.session_state;

          if (!accessToken) {
            logger.error('No access token received from Keycloak');
            return done(new Error('No access token received from Keycloak'));
          }

          if (!idToken) {
            logger.error('No ID token received from Keycloak');
            return done(new Error('No ID token received from Keycloak'));
          }

          const claims = jwt.decode(idToken);

          if (!claims || !claims.sub) {
            logger.error('Invalid token claims - missing sub');
            return done(new Error('Invalid token: missing sub claim'));
          }

          const decodedAccessToken = jwt.decode(accessToken);

          const actualLoginMethod = decodedAccessToken.broker_session_id
            ? (decodedAccessToken.identity_provider || 'google')
            : 'keycloak';

          const providerId = claims.sub;

          const roles = claims.realm_access?.roles || [];
          const user = {
            id: claims.sub,
            sub: claims.sub,
            email: claims.email,
            name: claims.name || claims.preferred_username,
            preferred_username: claims.preferred_username,
            roles,
            accessToken,
            refreshToken: refreshToken || null,
            idToken,
            tenant_id: claims.tenant_id || null,
            provider: actualLoginMethod,
            providerId: providerId,
            providerEmail: claims.email,
            emailVerified: claims.email_verified ?? false,
            sessionId: keycloakSessionId || null,
            isWorkspace: claims.hd ? true : false,
            workspaceDomain: claims.hd ?? null,
            givenName: claims.given_name,
            familyName: claims.family_name,
            picture: claims.picture,
            realm: claims.iss?.split('/realms/')[1] || null,
          };

          logger.info('Authentication successful', {
            email: user.email,
            userId: user.id,
            provider: actualLoginMethod,
            emailVerified: user.emailVerified,
            hasRefreshToken: !!user.refreshToken,
          });

          if (!user.refreshToken) {
            logger.warn('No refresh token received from Keycloak', {
              userId: user.id,
              clientId: client.client_id,
            });
          }

          if (user.tenant_id) {
            await UserMetadata.upsert({
              keycloak_id: user.id,
              org_id: user.tenant_id,
              is_active: true,
              last_login: new Date(),
            });

            await TenantMapping.upsert({
              user_id: user.id,
              tenant_id: user.tenant_id,
              client_key: clientKey,
            });
          }

          return done(null, user);
        } catch (err) {
          logger.error('Passport callback error', { error: err.message });
          return done(err);
        }
      }
    );

    passport.use(clientKey, passportStrategies[clientKey]);
    logger.info('Passport strategy initialized', { clientKey });
  }

  return passportStrategies[clientKey];
}

module.exports = { getPassportStrategy };