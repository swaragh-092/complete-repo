
const express = require('express');
const passport = require('passport');
// const { createProxyMiddleware } = require('http-proxy-middleware');
const { getPassportStrategy } = require('../../services/passport.service');
const { ACCOUNT_UI_URL, APP_URL, FRONTEND_URL, loadClients, KEYCLOAK_URL, getKeycloakService } = require('../../config');
const { Client, AuditLog, UserMetadata, TenantMapping, Sequelize, PendingInvitation, Organization, Role } = require('../../config/database');
const AuthCallbackService = require('../../services/auth-callback-service');
const { authMiddleware, requireSuperAdmin } = require('../../middleware/authMiddleware');
// const { authMiddleware, requireSuperAdmin } = require('../../middleware/authMiddleware');
const logger = require('../../utils/logger');
const SocialLoginService = require('../../services/social-login.service');
const TrustedDevicesService = require('../../services/trusted-devices.service');
const DeviceFingerprintService = require('../../services/device-fingerprint.service');
const RefreshTokenService = require('../../services/refresh-token.service');
const asyncHandler = require('../../middleware/asyncHandler');
const { AppError } = require('../../middleware/errorHandler');
const ResponseHandler = require('../../utils/responseHandler');
const AuditService = require('../../services/audit.service');
// const jwt = require('jsonwebtoken');

require('dotenv').config();








const router = express.Router();

const {
  REFRESH_COOKIE_DOMAIN,
  REFRESH_COOKIE_SECURE,
  REFRESH_COOKIE_SAMESITE,
  REFRESH_COOKIE_MAX_AGE
} = process.env;

const normalizeCookieDomain = (domainLike) => {
  if (!domainLike) return undefined;
  const trimmed = domainLike.trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  if (
    lower === 'localhost' ||
    lower.endsWith('.localhost') ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(lower)
  ) {
    return undefined;
  }
  return trimmed;
};

const safeParseUrl = (value) => {
  try {
    return value ? new URL(value) : null;
  } catch (error) {
    logger.warn('Invalid URL encountered during cookie handling', { value, error: error.message });
    return null;
  }
};

const deriveCookieDomain = (redirectUri) => {
  const explicitDomain = normalizeCookieDomain(REFRESH_COOKIE_DOMAIN);
  if (explicitDomain) {
    return explicitDomain;
  }

  const parsed = safeParseUrl(redirectUri);
  if (!parsed) return undefined;

  const hostname = parsed.hostname;
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
  ) {
    return undefined;
  }

  const parts = hostname.split('.');
  if (parts.length <= 2) {
    return `.${hostname}`;
  }

  return `.${parts.slice(-2).join('.')}`;
};

const shouldUseSecureCookies = (req, redirectUri) => {
  const forcedSecure = (REFRESH_COOKIE_SECURE || '').toLowerCase();
  if (forcedSecure === 'true') return true;
  if (forcedSecure === 'false') return false;

  const forwardedProto = (req.headers['x-forwarded-proto'] || '').split(',')[0];
  if (forwardedProto === 'https') return true;
  if (req.secure) return true;

  const parsed = safeParseUrl(redirectUri);
  return parsed?.protocol === 'https:';
};

const sameOrigin = (a, b) => {
  if (!a || !b) return false;
  return a === b;
};

const extractOrigin = (value) => {
  const parsed = safeParseUrl(value);
  return parsed ? `${parsed.protocol}//${parsed.host}` : null;
};

const buildRefreshCookieOptions = (req, redirectUri, savedOrigin) => {
  const secure = shouldUseSecureCookies(req, redirectUri);
  let sameSite = (REFRESH_COOKIE_SAMESITE || '').toLowerCase();
  if (!['none', 'lax', 'strict'].includes(sameSite)) {
    const requestOrigin = req.headers.origin || savedOrigin || null;
    const redirectOrigin = extractOrigin(redirectUri);
    const isCrossSite = requestOrigin && redirectOrigin && !sameOrigin(requestOrigin, redirectOrigin);
    sameSite = isCrossSite && secure ? 'none' : 'lax';
  }
  if (sameSite === 'none' && !secure) {
    // Browsers reject SameSite=None without Secure – degrade gracefully.
    sameSite = 'lax';
  }

  const maxAgeMs = Number(REFRESH_COOKIE_MAX_AGE || 30 * 24 * 60 * 60) * 1000;

  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: maxAgeMs,
    path: '/',
    domain: deriveCookieDomain(redirectUri)
  };
};

// ✅ FIXED: Strict redirect URI validation - no wildcards, exact matching only
async function validateRedirectUri(redirectUri, client) {
  logger.info('Validating redirect URI:', redirectUri, 'for client:', client);

  if (!redirectUri) {
    logger.warn('Redirect URI validation failed: no redirect URI provided');
    return false;
  }

  try {
    const uri = new URL(redirectUri);

    // ✅ STRICT VALIDATION: Must match client.redirect_url or client.callback_url exactly
    const allowedUris = [
      client.redirect_url,
      client.callback_url,
    ].filter(Boolean); // Remove null/undefined

    // Check exact match (origin + pathname)
    for (const allowed of allowedUris) {
      if (!allowed) continue;

      try {
        const allowedUrl = new URL(allowed);
        if (uri.origin === allowedUrl.origin && uri.pathname === allowedUrl.pathname) {
          logger.info('Redirect URI validated successfully', {
            redirectUri,
            matched: allowed
          });
          return true;
        }
      } catch (e) {
        logger.warn('Invalid allowed URI in config', { allowed, error: e.message });
        continue;
      }
    }

    // ✅ Development fallback: Allow localhost with any port (with warning)
    if (process.env.NODE_ENV === 'development' && uri.hostname === 'localhost') {
      logger.warn('Allowing localhost redirect in development mode', { redirectUri });
      return true;
    }

    logger.warn('Redirect URI validation failed', {
      redirectUri,
      allowedUris,
      clientId: client.client_id,
      clientKey: client.client_key
    });

    return false;
  } catch (error) {
    logger.error('Invalid redirect URI format', {
      redirectUri,
      error: error.message
    });
    return false;
  }
}

// getKeycloakService is now imported from config/index.js - uses cached instances



// routes/auth.js
// ✅ SIMPLIFIED: Let Keycloak handle OAuth state, PKCE, and session management
router.get('/login/:client', asyncHandler(async (req, res, next) => {
  const clientKey = req.params.client;
  const redirectUri = req.query.redirect_uri;

  logger.info('Authentication request initiated', {
    clientKey,
    redirectUri,
  });

  try {
    const clients = await loadClients();
    const client = clients[clientKey];

    if (!client) {
      throw new AppError(`Client ${clientKey} not found`, 400, 'INVALID_CLIENT');
    }

    // ✅ Validate redirect URI (if provided)
    if (redirectUri && !(await validateRedirectUri(redirectUri, client))) {
      logger.error('Invalid redirect URI', { redirectUri, clientKey });
      throw new AppError('The redirect URI does not match the configured client redirect URLs', 400, 'INVALID_REDIRECT_URI');
    }

    // ✅ Store redirect URI in session for callback (only if custom redirect provided)
    // Keycloak will handle state generation and validation automatically
    if (redirectUri && req.session) {
      req.session.oauth_redirect_uri = redirectUri;
      req.session.oauth_original_origin = req.headers.origin ||
        (req.headers.referer ? extractOrigin(req.headers.referer) : null) || null;
    }

    // ✅ Let passport-openidconnect handle everything:
    // - State generation and validation
    // - PKCE (if enabled in Keycloak client)
    // - Redirect to Keycloak
    await getPassportStrategy(clientKey);
    passport.authenticate(clientKey, { session: false })(req, res, next);

  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Login initiation failed', {
      error: err.message,
      stack: err.stack,
      clientKey
    });
    throw new AppError('Internal server error', 500, 'LOGIN_INIT_FAILED', { originalError: err.message });
  }
}));




// ✅ FIXED: Let Passport create session FIRST, then run business logic
router.get("/callback/:client", asyncHandler(async (req, res, next) => {
  console.log("🔔 CALLBACK ROUTE HIT:", {
    url: req.url,
    clientKey: req.params.client,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  const clientKey = req.params.client;

  logger.info("Authentication callback received", {
    clientKey,
    hasCode: !!req.query.code,
    hasState: !!req.query.state,
    hasError: !!req.query.error
  });

  const clients = await loadClients();
  const client = clients[clientKey];

  logger.info("🔴 BEFORE AUTH - Session status", {
    hasSession: !!req.session,
    sessionID: req.session?.id,
    sessionData: req.session ? Object.keys(req.session) : 'NO_SESSION'
  });


  if (!client) {
    logger.error("Client not found in callback", { clientKey });
    throw new AppError(`Client ${clientKey} not found`, 400, 'INVALID_CLIENT');
  }

  // Get session data
  const sessionData = req.session;
  const storedRedirectUri = sessionData?.oauth_redirect_uri;
  const storedOrigin = sessionData?.oauth_original_origin || null;

  let redirectUri = storedRedirectUri || req.query.redirecturi || client.redirect_url;

  logger.info("Stored redirect URI from session:", storedRedirectUri);


  // ✅ FIX: Validate and fallback to client.redirect_url if validation fails
  if (redirectUri) {
    const isValid = await validateRedirectUri(redirectUri, client);
    if (!isValid) {
      logger.warn("Callback redirect URI failed validation, using client default", {
        clientKey,
        attempted: redirectUri,
        clientDefault: client.redirect_url
      });
      redirectUri = client.redirect_url; // ✅ Fallback to client default
    }
  } else {
    // ✅ If no redirectUri at all, use client default
    redirectUri = client.redirect_url;
  }

  logger.info("Final redirect URI after validation:", redirectUri);


  // ✅ Final check: If STILL no redirectUri, throw error
  if (!redirectUri) {
    logger.error("No valid redirect URI available after all checks", {
      clientKey,
      clientRedirectUrl: client.redirect_url,
      storedRedirectUri,
      queryRedirectUri: req.query.redirecturi
    });
    throw new AppError('Unable to determine a safe redirect URI. Please check client configuration.', 400, 'INVALID_REDIRECT_URI');
  }



  const stateParam = req.query.state;

  logger.info("Processing callback", {
    clientKey,
    redirectUri,
    hasState: !!stateParam,
    sessionPresent: !!sessionData
  });

  await getPassportStrategy(clientKey);

  // ✅ CRITICAL FIX: Use passport.authenticate WITHOUT custom callback
  // This allows Passport to create the session IMMEDIATELY
  passport.authenticate(clientKey, { session: false })(req, res, async (authError) => {
    // ✅ Session is NOW created! req.user is populated!

    if (authError) {
      logger.error("Passport authentication error", {
        error: authError.message,
        stack: authError.stack,
        name: authError.name,
        code: authError.code,
        clientKey
      });
      console.error("FULL PASSPORT ERROR:", authError);
      return res.redirect(`${redirectUri}?error=authentication_failed&state=${stateParam}`);
    }


    if (!req.user) {
      logger.error("No user after authentication", { clientKey });
      return res.redirect(`${redirectUri}?error=no_user&state=${stateParam}`);
    }


    logger.info("🔍 Keycloak Session Debug", {
      keycloakSessionId: req.user?.sessionId || req.session?.keycloak_session || "NOT_RECEIVED",
      idToken: !!req.user?.idToken,
      accessToken: !!req.user?.accessToken,
      refreshToken: !!req.user?.refreshToken
    });

    logger.info("🟢 AFTER AUTH - Session status", {
      hasSession: !!req.session,
      sessionID: req.session?.id,
      isAuthenticated: req.isAuthenticated(),
      userId: req.user?.id,
      sessionData: req.session ? Object.keys(req.session) : 'NO_SESSION'
    });

    // ✅ NOW run all your business logic AFTER session is created
    try {
      const user = req.user;

      // res.send('before social checking');

      logger.info("Passport authentication successful", {
        userId: user.id,
        email: user.email,
        provider: user.provider
      });

      // ===== YOUR EXISTING BUSINESS LOGIC STARTS HERE =====

      // 1. Social login checks
      logger.info("Social login checks starting", {
        userId: user.id,
        email: user.email,
        provider: user.provider
      });

      const linkingCheck = await SocialLoginService.handleAccountLinking(user, client);

      if (linkingCheck.error) {
        logger.warn("Account linking failed", {
          email: user.email,
          code: linkingCheck.code
        });

        await AuditService.log({
          action: "ACCOUNT_LINKING_FAILED",
          userId: user.id,
          clientId: client.clientid,
          status: 'FAILURE',
          metadata: {
            email: user.email,
            provider: user.provider,
            code: linkingCheck.code
          }
        });

        return res.redirect(
          `${redirectUri}?error=account_linking_required&message=${encodeURIComponent(linkingCheck.message)}&state=${stateParam}`
        );
      }

      // 2. Track federated login
      const trackingResult = await SocialLoginService.trackFederatedLogin(user, req);

      if (trackingResult.tracked) {
        logger.info("Federated identity tracked successfully", {
          userId: user.id,
          provider: user.provider
        });
      }

      // 3. Detect suspicious login
      const suspiciousCheck = await SocialLoginService.detectSuspiciousLogin(user, req);

      if (suspiciousCheck.suspicious) {
        logger.warn("Suspicious login pattern detected", {
          email: user.email,
          alerts: suspiciousCheck.alerts
        });
        // Continue but log
      }

      // 4. Device trust check (non-critical)
      try {
        logger.info("🔐 Processing device trust check", { userId: user.id });

        const { fingerprint, deviceData } = await DeviceFingerprintService.generateFingerprint({
          headers: req.headers,
          body: req.body,
          user: user,
          ip: req.ip
        });

        const locationData = {
          country: req.body.location?.country || "Unknown",
          city: req.body.location?.city || "Unknown",
          ip: deviceData.ipAddress
        };

        const trustCheck = await TrustedDevicesService.isDeviceTrusted(
          user.id,
          fingerprint,
          deviceData,
          locationData
        );

        logger.info("Device Trust Status", {
          userId: user.id,
          isTrusted: trustCheck.isTrusted,
          riskLevel: trustCheck.riskScore.level
        });

        const [device, created] = await TrustedDevicesService.registerDevice(
          user.id,
          fingerprint,
          deviceData,
          deviceData.ipAddress,
          locationData.city,
          locationData.country
        );

        logger.info("Device registered", {
          deviceId: device.id,
          deviceName: device.devicename,
          created: created
        });

      } catch (deviceError) {
        logger.error("Device tracking error (non-critical)", deviceError);
      }

      // 5. Handle pending invitations
      logger.info("Checking for pending invitations", {
        userEmail: user.email,
        clientKey,
        provider: user.provider
      });

      const pendingResult = await AuthCallbackService.handlePendingInvitations(user, client);

      if (pendingResult.autoAccepted) {
        user.tenantid = pendingResult.tenantId;

        logger.info("Auto-accepted pending invitation", {
          userId: user.id,
          orgId: pendingResult.organization.id,
          tenantId: pendingResult.tenantId
        });

        await AuditService.log({
          action: "ORG_AUTO_JOINED",
          userId: user.id,
          orgId: pendingResult.organization.id,
          clientId: client.clientid,
          metadata: {
            email: user.email,
            orgname: pendingResult.organization.name,
            provider: user.provider
          }
        });
      } else if (pendingResult.requiresVerification) {
        logger.warn("Email verification required", {
          userEmail: user.email,
          provider: user.provider
        });

        return res.redirect(
          `${redirectUri}?error=email_verification_required&message=${encodeURIComponent(pendingResult.message)}&state=${stateParam}`
        );
      }

      // 6. Check tenant requirements
      if (client.requirestenant && !user.tenantid) {
        logger.info("Client requires tenant", {
          clientKey,
          userEmail: user.email
        });

        const tenantCheck = await AuthCallbackService.checkTenantRequirements(user, client);

        if (tenantCheck.needsTenant) {
          logger.info("User needs to create/join organization", {
            userEmail: user.email,
            availableActions: tenantCheck.availableActions
          });

          const onboardingUrl = `${redirectUri}/onboarding?clientkey=${clientKey}&accesstoken=${encodeURIComponent(user.accessToken)}&state=${stateParam}`;
          return res.redirect(onboardingUrl);
        } else {
          user.tenantid = tenantCheck.tenantId;
        }
      }

      // 7. Get organization context
      const orgContext = await AuthCallbackService.getUserOrganizationContext(user);

      logger.info("User organization context", {
        userId: user.id,
        primaryOrg: orgContext.primaryOrganization?.name,
        totalOrgs: orgContext.totalOrganizations
      });

      // 8. Set refresh token cookie
      if (user.refreshToken) {
        const cookieOptions = buildRefreshCookieOptions(req, redirectUri, storedOrigin);
        res.cookie("refreshToken", user.refreshToken, cookieOptions);
        res.cookie("account_refresh_token", user.refreshToken, cookieOptions);

        logger.info("Refresh token cookie set", {
          userId: user.id,
          secure: cookieOptions.secure,
          sameSite: cookieOptions.sameSite
        });
      }

      // 9. Store refresh token in database
      if (user.refreshToken) {
        try {
          let deviceId = null;
          try {
            const { fingerprint } = await DeviceFingerprintService.generateFingerprint({
              headers: req.headers,
              body: req.body,
              user: user,
              ip: req.ip
            });
            deviceId = fingerprint;
          } catch (deviceError) {
            logger.warn("Could not generate device fingerprint for token storage", deviceError);
          }

          await RefreshTokenService.storeToken({
            userId: user.id,
            clientId: client.client_id,  // ✅ Fixed: was clientid (typo)
            realmName: client.realm || client.Realm?.realmname,
            refreshToken: user.refreshToken,
            accessToken: user.accessToken,
            expiresIn: 2592000, // 30 days
            sessionId: req.session?.id || null,
            deviceId: deviceId,
            ipAddress: req.ip || req.connection?.remoteAddress || req.headers["x-forwarded-for"]?.split(",")[0]?.trim(),
            userAgent: req.get("user-agent"),
            metadata: {
              provider: user.provider,
              email: user.email,
              orgId: user.tenantid || orgContext.primaryOrganization?.id || null
            }
          });

          logger.info("Refresh token stored successfully", {
            userId: user.id,
            clientId: client.client_id  // ✅ Fixed: was clientid
          });

        } catch (tokenError) {
          logger.error("Failed to store refresh token", {
            error: tokenError.message,
            userId: user.id
          });
        }
      } else {
        logger.warn("No refresh token received from Keycloak", {
          userId: user.id,
          clientId: client.clientid
        });
      }

      // 10. Create success audit log
      await AuditService.log({
        action: "USER_LOGIN",
        userId: user.id,
        orgId: user.tenantid || orgContext.primaryOrganization?.id || null,
        clientId: client.clientid,
        status: 'SUCCESS',
        metadata: {
          email: user.email,
          provider: user.provider,
          emailVerified: user.emailVerified,
          organizationsCount: orgContext.totalOrganizations
        }
      });

      // 11. Build final redirect URL
      let finalRedirect;

      // For HTTP development, include refresh_token in URL since cookies don't work cross-origin
      const isHttpDev = process.env.NODE_ENV !== 'production' && !req.secure;
      const refreshTokenParam = isHttpDev && user.refreshToken
        ? `&refresh_token=${encodeURIComponent(user.refreshToken)}`
        : '';

      if (client.requirestenant && user.tenantid) {
        const appDomain = process.env.APP_DOMAIN || new URL(FRONTEND_URL).hostname;
        const tenantDomain = `${user.tenantid}.${appDomain}`; // Should this also be config? Left as is for now or use FRONTEND_URL fallback?
        // Using FRONTEND_URL hostname if APP_DOMAIN missing might be safer
        // const appDomain = process.env.APP_DOMAIN || new URL(FRONTEND_URL).hostname;
        // const tenantDomain = `${user.tenantid}.${appDomain}`;
        finalRedirect = `http${process.env.NODE_ENV === "production" ? "s" : ""}://${tenantDomain}?accesstoken=${encodeURIComponent(user.accessToken)}&state=${stateParam}${refreshTokenParam}`;

        logger.info("Redirecting to tenant-specific URL", {
          userId: user.id,
          tenantId: user.tenantid,
          redirectUri: finalRedirect
        });
      } else {
        finalRedirect = `${redirectUri}?access_token=${encodeURIComponent(user.accessToken)}&state=${stateParam}${refreshTokenParam}`;

        logger.info("Redirecting to standard URL", {
          userId: user.id,
          redirectUri: finalRedirect,
          includesRefreshToken: isHttpDev && !!user.refreshToken
        });
      }

      if (user.refreshToken) {
        logger.info("Refresh token set in httpOnly cookie (NOT in URL)", {
          userId: user.id,
          hasRefreshToken: true,
          cookieSet: true
        });
      } else {
        logger.warn("No refresh token available", {
          userId: user.id
        });
      }

      logger.info("Redirecting user to application", {
        userId: user.id,
        userEmail: user.email,
        provider: user.provider,
        hasRefreshTokenCookie: !!user.refreshToken
      });

      // Clean up session
      if (sessionData) {
        delete sessionData.oauth_redirect_uri;
        delete sessionData.oauth_original_origin;
      }

      // res.send("TEMP: auth-service finished, not redirecting");

      // ✅ Final redirect with tokens
      console.log("🔀 FINAL REDIRECT URL:", finalRedirect);
      console.log("🔀 REDIRECT URL LENGTH:", finalRedirect.length);
      res.redirect(finalRedirect);

    } catch (error) {
      logger.error("Callback processing failed", {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id
      });

      await AuditService.log({
        action: "CALLBACK_ERROR",
        userId: req.user?.id || null,
        orgId: req.user?.tenantid || null,
        clientId: client.clientid,
        status: 'ERROR',
        message: error.message,
        metadata: {
          error: error.message,
          provider: req.user?.provider
        }
      });

      res.redirect(`${redirectUri}?error=internal_server_error&state=${stateParam}`);
    }
  });
}));



// routes/auth.js - Enhanced logout with social provider support

// ADD THIS NEW ROUTE in routes/auth.js
// ✅ ADD THIS NEW ROUTE (GET for auto-redirect)
// ✅ POST LOGOUT - Production-ready version
// ✅ PRODUCTION-READY POST LOGOUT ROUTE
router.post('/logout/:client', asyncHandler(async (req, res) => {
  try {
    const clientKey = req.params.client;
    const clients = await loadClients();
    const client = clients[clientKey];

    if (!client) {
      throw new AppError('Invalid client', 400, 'INVALID_CLIENT');
    }

    const realmName = client.realm || client.Realm?.realm_name;

    if (!realmName) {
      throw new AppError('Realm not found', 500, 'REALM_NOT_FOUND');
    }

    const refreshToken = req.body.refreshToken ||
      req.cookies.refreshToken ||
      req.cookies.account_refresh_token ||
      req.headers['x-refresh-token'];

    logger.info('🔵 POST Logout - Refresh token:', refreshToken ? 'Found' : 'Not found');

    // Revoke token in database
    if (refreshToken) {
      try {
        await RefreshTokenService.revokeToken(refreshToken, 'logout');
        logger.info('✅ Refresh token revoked');
      } catch (err) {
        logger.warn('⚠️ Token revocation failed:', err.message);
      }
      const logoutCookieOptions = buildRefreshCookieOptions(
        req,
        client.redirect_url,
        req.headers.origin || null
      );
      const clearOptions = { ...logoutCookieOptions };
      delete clearOptions.maxAge;

      res.clearCookie('refreshToken', clearOptions);
      res.clearCookie('account_refresh_token', clearOptions);
    }

    // ✅ SMART REDIRECT URL BUILDER
    // Takes redirect_url from DB and fixes it for logout
    // ✅ SMART REDIRECT URL BUILDER
    // Takes redirect_url from DB and fixes it for logout
    let postLogoutRedirectUri = client.redirect_url || ACCOUNT_UI_URL;

    // Remove /callback if it exists (it's for login, not logout)
    if (postLogoutRedirectUri.endsWith('/callback')) {
      postLogoutRedirectUri = postLogoutRedirectUri.replace(/\/callback$/, '/');
    }

    // Add port if missing (for localhost domains)
    const url = new URL(postLogoutRedirectUri);
    if (url.hostname.includes('localhost') && !url.port) {
      // Extract port from the original if it exists in a weird format
      const portMatch = postLogoutRedirectUri.match(/:(\d+)/);
      if (portMatch) {
        url.port = portMatch[1];
      } else {
        // Default to 5174 for account.localhost
        if (url.hostname === 'account.localhost') {
          url.port = '5174';
        }
      }
      postLogoutRedirectUri = url.toString();
    }

    logger.info('🔄 Original redirect_url:', client.redirect_url);
    logger.info('✅ Fixed post_logout_redirect_uri:', postLogoutRedirectUri);

    // Build Keycloak logout URL
    const keycloakLogoutUrl =
      `${KEYCLOAK_URL}/realms/${realmName}/protocol/openid-connect/logout?` +
      `client_id=${client.client_id}&` +
      `post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;

    logger.info('🔗 Keycloak logout URL:', keycloakLogoutUrl);

    res.json({
      success: true,
      keycloakLogoutUrl,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('❌ Logout error:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Logout failed', 500, 'LOGOUT_FAILED', { originalError: error.message });
  }
}));









router.get('/onboarding-status', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const clientKey = req.query.client_key;

    if (!clientKey) {
      throw new AppError('client_key parameter required', 400, 'MISSING_PARAMETERS');
    }

    const clients = await loadClients();
    const client = clients[clientKey];

    if (!client) {
      throw new AppError('Client not found', 400, 'INVALID_CLIENT');
    }

    // Check for pending invitations
    const pendingInvitation = await PendingInvitation.findOne({
      where: {
        email: userEmail,
        status: 'pending'
      },
      include: [
        {
          model: Organization,
          attributes: ['id', 'name', 'tenant_id']
        },
        {
          model: Role,
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    // Check tenant requirements
    const tenantCheck = await AuthCallbackService.checkTenantRequirements(
      { keycloak_id: req.user.keycloak_id },
      client
    );

    // Get organization context
    const orgContext = await AuthCallbackService.getUserOrganizationContext({ id: userId });

    res.json({
      user: {
        id: userId,
        email: userEmail,
        email_verified: req.user.email_verified || false
      },
      client: {
        key: clientKey,
        name: client.name || clientKey,
        requires_tenant: client.requires_tenant
      },
      pending_invitation: pendingInvitation ? {
        id: pendingInvitation.id,
        organization: pendingInvitation.Organization,
        role: pendingInvitation.Role
      } : null,
      tenant_status: {
        needs_tenant: tenantCheck.needsTenant,
        current_tenant_id: tenantCheck.tenantId || null,
        available_actions: tenantCheck.availableActions || []
      },
      organizations: {
        primary: orgContext.primaryOrganization,
        memberships: orgContext.memberships,
        total: orgContext.totalOrganizations
      }
    });

  } catch (error) {
    logger.error('Failed to get onboarding status', {
      error: error.message,
      userId: req.user?.id
    });

    if (error instanceof AppError) throw error;
    throw new AppError('Failed to retrieve onboarding status', 500, 'STATUS_CHECK_FAILED', { originalError: error.message });
  }
}));


// ============================================================================
// GET /auth/clients/:clientKey/config
// Fetch client configuration for UI generation (used by sso-client generate-ui)
// ============================================================================
router.get('/clients/:clientKey/config', asyncHandler(async (req, res) => {
  try {
    const { clientKey } = req.params;

    logger.info('📡 Client config request for:', clientKey);

    // Get Client model from database
    const { Client, Realm } = require('../../config/database');

    const client = await Client.findOne({
      where: {
        client_key: clientKey
      },
      include: [
        {
          model: Realm,
          attributes: ['realm_name', 'display_name']
        }
      ]
    });

    if (!client) {
      logger.info('❌ Client not found:', clientKey);
      throw new AppError(`Client with key "${clientKey}" does not exist or has not been approved`, 404, 'NOT_FOUND');
    }

    // Build configuration response
    const config = {
      client_key: client.client_key,
      client_id: client.client_id,
      name: client.display_name || client.client_key, // Enhanced name support
      redirect_url: client.redirect_url,
      callback_url: client.callback_url,

      // ✅ Organization settings (from database)
      requires_organization: client.requires_organization || false,
      organization_model: client.organization_model || null,
      onboarding_flow: client.onboarding_flow || null,
      organization_features: client.organization_features || [],

      // Realm info
      realm: client.Realm?.realm_name || 'my-projects',
      realm_display: client.Realm?.display_name || 'My Projects',

      // Metadata
      created_at: client.created_at,

      // UI Metadata (Schema v2)
      description: client.description || 'No description available',
      icon: client.icon || '🔗',
      primary_color: client.primary_color || '#3B82F6',
    };

    logger.info('✅ Client config sent:', {
      clientKey,
      requiresOrg: config.requires_organization,
      orgModel: config.organization_model,
      onboardingFlow: config.onboarding_flow
    });

    res.json(config);

  } catch (error) {
    logger.error('❌ Failed to get client config:', error);
    logger.error('❌ Failed to get client config:', error);
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch client configuration', 500, 'FETCH_FAILED', { originalError: error.message });
  }
}));




// Get current user profile
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    const orgContext = await AuthCallbackService.getUserOrganizationContext({ id: user.id });

    const profile = {
      sub: user.sub,
      name: user.name,
      email: user.email,
      preferred_username: user.preferred_username,
      roles: user.roles,
      client_id: user.client_id,
      tenant_id: user.tenant_id,
      organizations: orgContext
    };

    res.json(profile);
  } catch (error) {
    logger.error('Failed to get user profile', {
      error: error.message,
      userId: req.user?.id
    });

    if (error instanceof AppError) throw error;
    throw new AppError('Failed to get user profile', 500, 'FETCH_FAILED', { originalError: error.message });
  }
}));





router.post('/refresh/:client', asyncHandler(async (req, res) => {
  const clientKey = req.params.client;
  const clients = await loadClients();
  const client = clients[clientKey];

  if (!client) {
    throw new AppError(`Invalid client: ${clientKey}`, 400, 'INVALID_CLIENT');
  }

  // Check multiple sources for refresh token
  const refreshToken = req.cookies.refreshToken ||
    req.cookies.account_refresh_token ||
    req.body.refreshToken ||
    req.headers['x-refresh-token'];

  if (!refreshToken) {
    throw new AppError('Refresh token not found in cookies, body, or headers', 400, 'MISSING_TOKEN');
  }

  try {
    // Validate token exists in database
    const validation = await RefreshTokenService.validateToken(refreshToken);

    if (!validation.valid) {
      logger.warn('Invalid refresh token attempt', {
        reason: validation.reason,
        clientKey,
        ip: req.ip,
      });

      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN', { reason: validation.reason });
    }

    // Get realm name (handle both old and new client structure)
    const realmName = client.realm || client.Realm?.realm_name;

    if (!realmName) {
      logger.error('Realm name not found for client', { clientKey });
      throw new AppError('Client configuration error', 500, 'CONFIG_ERROR');
    }

    // Request new tokens from Keycloak
    const response = await fetch(
      `${KEYCLOAK_URL}/realms/${realmName}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: client.client_id,
          client_secret: client.client_secret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Keycloak refresh failed', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        clientKey,
      });

      // Revoke token if Keycloak says it's invalid
      if (response.status === 400 || response.status === 401) {
        await RefreshTokenService.revokeToken(refreshToken, 'keycloak_invalid');
      }



      throw new AppError('Invalid or expired refresh token', 401, 'TOKEN_REFRESH_FAILED');
    }

    const tokenData = await response.json();
    const { access_token, refresh_token: new_refresh_token, expires_in, refresh_expires_in } = tokenData;

    if (!access_token) {
      throw new AppError('No access token received from Keycloak', 500, 'TOKEN_REFRESH_FAILED');
    }

    // Rotate refresh token (revoke old, store new)
    if (new_refresh_token) {
      try {
        await RefreshTokenService.rotateToken({
          oldRefreshToken: refreshToken,
          newRefreshToken: new_refresh_token,
          userId: validation.tokenRecord.user_id,
          clientId: client.client_id,
          realmName: realmName,
          expiresIn: refresh_expires_in || 2592000, // 30 days default
          sessionId: req.session?.id || null,
          deviceId: validation.tokenRecord.device_id,
          ipAddress: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
          userAgent: req.get('user-agent'),
          metadata: validation.tokenRecord.metadata || {},
        });
      } catch (rotateError) {
        logger.error('Failed to rotate refresh token', {
          error: rotateError.message,
          userId: validation.tokenRecord.user_id,
        });
        // Continue even if rotation fails - user still gets new access token
      }

      // Set new refresh token in httpOnly cookie
      const isCrossSite = !!req.headers.origin;
      const sameSite = isCrossSite ? 'none' : 'lax';
      const secure =
        isCrossSite || process.env.NODE_ENV === 'production';
      const cookieOptions = buildRefreshCookieOptions(
        req,
        client.redirect_url,
        req.headers.origin || null
      );
      cookieOptions.maxAge = (refresh_expires_in || 2592000) * 1000;
      // Write with both names for compatibility
      res.cookie('refreshToken', new_refresh_token, cookieOptions);
      res.cookie('account_refresh_token', new_refresh_token, cookieOptions);
    }

    // Log successful refresh
    logger.info('Token refreshed successfully', {
      userId: validation.tokenRecord.user_id,
      clientId: client.client_id,
      hasNewRefreshToken: !!new_refresh_token,
    });

    res.json({
      access_token,
      expires_in: expires_in || 300, // 5 minutes default
      ...(new_refresh_token && { refresh_token: new_refresh_token }), // Only include if rotated
    });

  } catch (err) {
    logger.error('Token refresh failed', {
      error: err.message,
      stack: err.stack,
      clientKey
    });

    if (err instanceof AppError) throw err;
    throw new AppError('Internal server error during token refresh', 500, 'TOKEN_REFRESH_ERROR', { originalError: err.message });
  }
}));





// LEGACY_DISABLED: router.post('/org/create', asyncHandler(async (req, res) => {
// LEGACY_DISABLED:   const { token, client_id, name, slug, plan, db_type, db_name, logo_url, storage_limit } = req.body;
// LEGACY_DISABLED:   const client = Object.values(CLIENTS).find((c) => c.client_id === client_id);
// LEGACY_DISABLED:   if (!client) {
// LEGACY_DISABLED:     throw new AppError('Invalid client', 400, 'INVALID_CLIENT');
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: 
// LEGACY_DISABLED:   try {
// LEGACY_DISABLED:     const { rows } = await pool.query(
// LEGACY_DISABLED:       'INSERT INTO organizations (name, slug, plan, db_type, db_name, logo_url, storage_limit) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
// LEGACY_DISABLED:       [name, slug, plan || 'free', db_type || 'shared', db_name, logo_url, storage_limit]
// LEGACY_DISABLED:     );
// LEGACY_DISABLED:     const org_id = rows[0].id;
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     await pool.query(
// LEGACY_DISABLED:       'INSERT INTO tenants_apps (org_id, client_id, app_name) VALUES ($1, $2, $3)',
// LEGACY_DISABLED:       [org_id, client_id, client_id.split('-')[0].toUpperCase()]
// LEGACY_DISABLED:     );
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     const user = req.user;
// LEGACY_DISABLED:     await pool.query(
// LEGACY_DISABLED:       'INSERT INTO user_metadata (keycloak_id, org_id, designation) VALUES ($1, $2, $3)',
// LEGACY_DISABLED:       [user.id, org_id, 'Owner']
// LEGACY_DISABLED:     );
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     const keycloakService = new KeycloakService(client.realm);
// LEGACY_DISABLED:     await keycloakService.initialize();
// LEGACY_DISABLED:     await keycloakService.updateUserAttributes(user.id, { org_id });
// LEGACY_DISABLED:     await keycloakService.assignRole(user.id, `${client_id}:admin`, client_id);
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     await pool.query(
// LEGACY_DISABLED:       'INSERT INTO audit_logs (org_id, user_id, client_id, action, details) VALUES ($1, $2, $3, $4, $5)',
// LEGACY_DISABLED:       [org_id, user.id, client_id, 'org_created', { name, slug }]
// LEGACY_DISABLED:     );
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     return ResponseHandler.created(res, { org_id }, 'Organization created');
// LEGACY_DISABLED:   } catch (error) {
// LEGACY_DISABLED:     if (error instanceof AppError) throw error;
// LEGACY_DISABLED:     throw new AppError('Organization creation failed', 500, 'CREATION_FAILED', { originalError: error.message });
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: }));
// LEGACY_DISABLED: 
// LEGACY_DISABLED: router.post('/org/join', asyncHandler(async (req, res) => {
// LEGACY_DISABLED:   const { token, client_id, org_slug, invitation_code } = req.body;
// LEGACY_DISABLED:   const client = Object.values(CLIENTS).find((c) => c.client_id === client_id);
// LEGACY_DISABLED:   if (!client) {
// LEGACY_DISABLED:     throw new AppError('Invalid client', 400, 'INVALID_CLIENT');
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: 
// LEGACY_DISABLED:   try {
// LEGACY_DISABLED:     const { rows } = await pool.query('SELECT id FROM organizations WHERE slug = $1', [org_slug]);
// LEGACY_DISABLED:     if (!rows[0]) {
// LEGACY_DISABLED:       throw new AppError('Organization not found', 404, 'NOT_FOUND');
// LEGACY_DISABLED:     }
// LEGACY_DISABLED:     const org_id = rows[0].id;
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     // Placeholder for invitation code validation
// LEGACY_DISABLED:     if (invitation_code !== 'valid_code') {
// LEGACY_DISABLED:       throw new AppError('Invalid invitation code', 403, 'INVALID_CODE');
// LEGACY_DISABLED:     }
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     const user = req.user;
// LEGACY_DISABLED:     await pool.query(
// LEGACY_DISABLED:       'INSERT INTO user_metadata (keycloak_id, org_id) VALUES ($1, $2) ON CONFLICT (keycloak_id) UPDATE SET org_id = $2',
// LEGACY_DISABLED:       [user.id, org_id]
// LEGACY_DISABLED:     );
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     const keycloakService = new KeycloakService(client.realm);
// LEGACY_DISABLED:     await keycloakService.initialize();
// LEGACY_DISABLED:     await keycloakService.updateUserAttributes(user.id, { org_id });
// LEGACY_DISABLED:     await keycloakService.assignRole(user.id, `${client_id}:default`, client_id);
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     await pool.query(
// LEGACY_DISABLED:       'INSERT INTO audit_logs (org_id, user_id, client_id, action, details) VALUES ($1, $2, $3, $4, $5)',
// LEGACY_DISABLED:       [org_id, user.id, client_id, 'org_joined', { org_slug }]
// LEGACY_DISABLED:     );
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     res.json({ org_id, message: 'Joined organization' });
// LEGACY_DISABLED:   } catch (error) {
// LEGACY_DISABLED:     if (error instanceof AppError) throw error;
// LEGACY_DISABLED:     throw new AppError('Failed to join organization', 500, 'JOIN_FAILED', { originalError: error.message });
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: }));
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: router.post('/clients', asyncHandler(async (req, res) => {
// LEGACY_DISABLED:   const { client_key, realm, client_id, client_secret, redirect_url, requires_tenant, tenant_id } = req.body;
// LEGACY_DISABLED:   if (!client_key || !realm || !client_id || !client_secret || !redirect_url) {
// LEGACY_DISABLED:     throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: 
// LEGACY_DISABLED:   try {
// LEGACY_DISABLED:     const kc = await getKeycloakService(realm);
// LEGACY_DISABLED:     await kc.createClient({ clientId: client_id, secret: client_secret, redirectUris: [redirect_url] });
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     const client = await Client.create({
// LEGACY_DISABLED:       client_key,
// LEGACY_DISABLED:       realm,
// LEGACY_DISABLED:       client_id,
// LEGACY_DISABLED:       client_secret,
// LEGACY_DISABLED:       callback_url: `${APP_URL}/auth/callback/${client_key}`,
// LEGACY_DISABLED:       redirect_url,
// LEGACY_DISABLED:       requires_tenant: requires_tenant || false,
// LEGACY_DISABLED:       tenant_id,
// LEGACY_DISABLED:     });
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     await AuditLog.create({
// LEGACY_DISABLED:       org_id: null,
// LEGACY_DISABLED:       user_id: null,
// LEGACY_DISABLED:       client_id,
// LEGACY_DISABLED:       action: 'client_create',
// LEGACY_DISABLED:       details: { client_key, realm },
// LEGACY_DISABLED:     });
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     await require('../passport').configurePassport();
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     res.json(client);
// LEGACY_DISABLED:   } catch (err) {
// LEGACY_DISABLED:     logger.error('Client registration error:', err);
// LEGACY_DISABLED:     if (err instanceof AppError) throw err;
// LEGACY_DISABLED:     throw new AppError('Failed to register client', 500, 'REGISTRATION_FAILED', { originalError: err.message });
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: }));
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: router.get('/clients', asyncHandler(async (req, res) => {
// LEGACY_DISABLED:   try {
// LEGACY_DISABLED:     const {
// LEGACY_DISABLED:       realm = 'my-projects',
// LEGACY_DISABLED:       page = 1,
// LEGACY_DISABLED:       limit = 10,
// LEGACY_DISABLED:       search = '',
// LEGACY_DISABLED:       sortBy = 'clientId',
// LEGACY_DISABLED:       sortOrder = 'asc',
// LEGACY_DISABLED:     } = req.query;
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     const kc = await getKeycloakService(realm);
// LEGACY_DISABLED:     const allClients = await kc.getClients();
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     // Filter by search
// LEGACY_DISABLED:     let filtered = allClients.filter(client =>
// LEGACY_DISABLED:       client.clientId.toLowerCase().includes(search.toLowerCase()) ||
// LEGACY_DISABLED:       (client.name || '').toLowerCase().includes(search.toLowerCase())
// LEGACY_DISABLED:     );
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     // Sort
// LEGACY_DISABLED:     filtered.sort((a, b) => {
// LEGACY_DISABLED:       const valA = (a[sortBy] || '').toString().toLowerCase();
// LEGACY_DISABLED:       const valB = (b[sortBy] || '').toString().toLowerCase();
// LEGACY_DISABLED:       if (sortOrder === 'asc') return valA.localeCompare(valB);
// LEGACY_DISABLED:       else return valB.localeCompare(valA);
// LEGACY_DISABLED:     });
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     // Paginate
// LEGACY_DISABLED:     const offset = (page - 1) * limit;
// LEGACY_DISABLED:     const paginated = filtered.slice(offset, offset + Number(limit));
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     res.json({
// LEGACY_DISABLED:       rows: paginated,
// LEGACY_DISABLED:       count: filtered.length,
// LEGACY_DISABLED:     });
// LEGACY_DISABLED:   } catch (err) {
// LEGACY_DISABLED:     logger.error('Client fetch error:', err);
// LEGACY_DISABLED:     if (err instanceof AppError) throw err;
// LEGACY_DISABLED:     throw new AppError('Failed to fetch clients', 500, 'FETCH_FAILED', { originalError: err.message });
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: }));
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: // async function getKeycloakAdminToken() {
// LEGACY_DISABLED: //   const response = await axios.post(
// LEGACY_DISABLED: //     `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
// LEGACY_DISABLED: //     new URLSearchParams({
// LEGACY_DISABLED: //       client_id: 'admin-cli',
// LEGACY_DISABLED: //       username: 'admin', // Replace with env variable
// LEGACY_DISABLED: //       password: 'admin', // Replace with env variable
// LEGACY_DISABLED: //       grant_type: 'password',
// LEGACY_DISABLED: //     })
// LEGACY_DISABLED: //   );
// LEGACY_DISABLED: //   return response.data.access_token;
// LEGACY_DISABLED: // }
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: router.post('/verify-token', asyncHandler(async (req, res) => {
// LEGACY_DISABLED:   const { token, client_id } = req.body;
// LEGACY_DISABLED:   const client = Object.values(CLIENTS).find((c) => c.client_id === client_id);
// LEGACY_DISABLED:   if (!client) {
// LEGACY_DISABLED:     throw new AppError('Invalid client', 400, 'INVALID_CLIENT');
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: 
// LEGACY_DISABLED:   try {
// LEGACY_DISABLED:     const decoded = await verifyJwt(token, client.realm);
// LEGACY_DISABLED:     let metadata = {};
// LEGACY_DISABLED:     if (client.requiresTenant) {
// LEGACY_DISABLED:       const { rows } = await pool.query(
// LEGACY_DISABLED:         'SELECT * FROM user_metadata WHERE keycloak_id = $1 AND org_id = $2',
// LEGACY_DISABLED:         [decoded.sub, decoded.tenant_id]
// LEGACY_DISABLED:       );
// LEGACY_DISABLED:       if (!rows[0]) {
// LEGACY_DISABLED:         throw new AppError('Invalid tenant', 403, 'INVALID_TENANT');
// LEGACY_DISABLED:       }
// LEGACY_DISABLED:       metadata = rows[0];
// LEGACY_DISABLED:     }
// LEGACY_DISABLED:     const user = {
// LEGACY_DISABLED:       id: decoded.sub,
// LEGACY_DISABLED:       tenant_id: decoded.tenant_id,
// LEGACY_DISABLED:       roles: decoded.realm_access?.roles || [],
// LEGACY_DISABLED:       email: decoded.email,
// LEGACY_DISABLED:       displayName: decoded.name,
// LEGACY_DISABLED:       metadata,
// LEGACY_DISABLED:     };
// LEGACY_DISABLED:     res.json(user);
// LEGACY_DISABLED:   } catch (error) {
// LEGACY_DISABLED:     if (error instanceof AppError) throw error;
// LEGACY_DISABLED:     throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN', { originalError: error.message });
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: }));
// LEGACY_DISABLED: 
// LEGACY_DISABLED: // GET /roles?realm=my-projects&clientId=my-client
// LEGACY_DISABLED: router.get('/roles', asyncHandler(async (req, res) => {
// LEGACY_DISABLED:   const { realm = 'my-projects', clientId } = req.query;
// LEGACY_DISABLED: 
// LEGACY_DISABLED:   if (!clientId) {
// LEGACY_DISABLED:     return res.status(400).json({ error: 'clientId is required' });
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: 
// LEGACY_DISABLED:   try {
// LEGACY_DISABLED:     const kc = await getKeycloakService(realm);
// LEGACY_DISABLED:     const roles = await kc.getClientRoles(clientId);
// LEGACY_DISABLED:     res.json(roles);
// LEGACY_DISABLED:   } catch (error) {
// LEGACY_DISABLED:     logger.error('Failed to fetch roles:', error.message);
// LEGACY_DISABLED:     if (error instanceof AppError) throw error;
// LEGACY_DISABLED:     throw new AppError('Failed to fetch roles', 500, 'FETCH_FAILED', { originalError: error.message });
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: }));
// LEGACY_DISABLED: 
// LEGACY_DISABLED: router.get('/roles/client/:clientId', asyncHandler(async (req, res) => {
// LEGACY_DISABLED:   const { realm = 'my-projects' } = req.query;
// LEGACY_DISABLED:   const { clientId } = req.params;
// LEGACY_DISABLED: 
// LEGACY_DISABLED:   if (!clientId) {
// LEGACY_DISABLED:     return res.status(400).json({ error: 'clientId is required' });
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: 
// LEGACY_DISABLED:   try {
// LEGACY_DISABLED:     const kc = await getKeycloakService(realm);
// LEGACY_DISABLED:     const roles = await kc.getClientRoles(clientId);
// LEGACY_DISABLED:     res.json(roles);
// LEGACY_DISABLED:   } catch (error) {
// LEGACY_DISABLED:     logger.error('Failed to fetch client roles:', error.message);
// LEGACY_DISABLED:     if (error instanceof AppError) throw error;
// LEGACY_DISABLED:     throw new AppError('Failed to fetch client roles', 500, 'FETCH_FAILED', { originalError: error.message });
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: }));
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: router.post('/roles/client/:clientId', asyncHandler(async (req, res) => {
// LEGACY_DISABLED:   const { realm = 'my-projects', roleName, description = '' } = req.body;
// LEGACY_DISABLED:   const { clientId } = req.params;
// LEGACY_DISABLED:   if (!clientId || !roleName) {
// LEGACY_DISABLED:     return res.status(400).json({ error: 'clientId and roleName are required' });
// LEGACY_DISABLED:   }
// LEGACY_DISABLED:   try {
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     const kc = await getKeycloakService(realm);
// LEGACY_DISABLED:     const role = await kc.createClientRole(clientId, roleName, description);
// LEGACY_DISABLED:     return ResponseHandler.created(res, role, 'Role created successfully');
// LEGACY_DISABLED:   } catch (error) {
// LEGACY_DISABLED:     logger.error('Failed to create role:', error.message);
// LEGACY_DISABLED:     if (error instanceof AppError) throw error;
// LEGACY_DISABLED:     throw new AppError('Failed to create role', 500, 'CREATION_FAILED', { originalError: error.message });
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: }));
// LEGACY_DISABLED: 
// LEGACY_DISABLED: // PUT /roles/:id
// LEGACY_DISABLED: router.put('/roles/:id', asyncHandler(async (req, res) => {
// LEGACY_DISABLED:   const { realm = 'my-projects' } = req.query;
// LEGACY_DISABLED:   const { id } = req.params;
// LEGACY_DISABLED:   const { clientId, roleName, description } = req.body;
// LEGACY_DISABLED: 
// LEGACY_DISABLED:   if (!clientId || !roleName) {
// LEGACY_DISABLED:     return res.status(400).json({ error: 'clientId and roleName are required' });
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: 
// LEGACY_DISABLED:   try {
// LEGACY_DISABLED:     const kc = await getKeycloakService(realm);
// LEGACY_DISABLED:     const updatedRole = await kc.updateClientRole(clientId, id, roleName, description);
// LEGACY_DISABLED:     res.json(updatedRole);
// LEGACY_DISABLED:   } catch (error) {
// LEGACY_DISABLED:     logger.error('Failed to update role:', error.message);
// LEGACY_DISABLED:     if (error instanceof AppError) throw error;
// LEGACY_DISABLED:     throw new AppError('Failed to update role', 500, 'UPDATE_FAILED', { originalError: error.message });
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: }));
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: 
// LEGACY_DISABLED: router.post('/roles', asyncHandler(async (req, res) => {
// LEGACY_DISABLED:   const { realm, role_name, description } = req.body;
// LEGACY_DISABLED:   if (!realm || !role_name) {
// LEGACY_DISABLED:     throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: 
// LEGACY_DISABLED:   try {
// LEGACY_DISABLED:     const adminToken = await getKeycloakAdminToken();
// LEGACY_DISABLED:     await axios.post(
// LEGACY_DISABLED:       `${KEYCLOAK_URL}/admin/realms/${realm}/roles`,
// LEGACY_DISABLED:       { name: role_name, description },
// LEGACY_DISABLED:       {
// LEGACY_DISABLED:         headers: {
// LEGACY_DISABLED:           Authorization: `Bearer ${adminToken}`,
// LEGACY_DISABLED:           'Content-Type': 'application/json',
// LEGACY_DISABLED:         },
// LEGACY_DISABLED:       }
// LEGACY_DISABLED:     );
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     await pool.query(
// LEGACY_DISABLED:       'INSERT INTO audit_logs (org_id, user_id, client_id, action, details) VALUES ($1, $2, $3, $4, $5)',
// LEGACY_DISABLED:       [null, null, null, 'role_create', { realm, role_name }]
// LEGACY_DISABLED:     );
// LEGACY_DISABLED: 
// LEGACY_DISABLED:     res.json({ message: `Role ${role_name} created` });
// LEGACY_DISABLED:   } catch (err) {
// LEGACY_DISABLED:     logger.error('Role creation error:', err);
// LEGACY_DISABLED:     if (err instanceof AppError) throw err;
// LEGACY_DISABLED:     throw new AppError('Failed to create role', 500, 'CREATION_FAILED', { originalError: err.message });
// LEGACY_DISABLED:   }
// LEGACY_DISABLED: }));

// router.get('/users', authMiddleware, async(req, res)=> {
//   const realm =  req?.query.realm;

//   if(!realm){
//     res.status(404).json('incalid realm')
//   }

//     const kc = await getKeycloakService(realm);

//     const users = await  kc.getAllUser() ;
//     logger.info(users);


//     logger.info(users.length);

//     // let userData = []


//     // users.forEach(user => {
//     //     userData.push({
//     //   id: user.sub,
//     //   email: user.email,
//     //   name: user.name || user.preferred_username,
//     //   roles: user.realm_access?.roles || accessTokenClaims.realm_access?.roles || [],
//     //   accessToken: access_token,
//     //   refreshToken: new_refresh_token,
//     //   idToken: id_token,
//     //   tenant_id: claims.tenant_id || null,
//     // });

//     // await AuditLog.create({
//     //   org_id: user.tenant_id || null,
//     //   user_id: user.id,
//     //   client_id: client.client_id,
//     //   action: 'token_refresh',
//     //   details: { email: user.email, roles: user.roles },
//     // });

//     // if (user.tenant_id) {
//     //   await UserMetadata.upsert({
//     //     keycloak_id: user.id,
//     //     org_id: user.tenant_id,
//     //     is_active: true,
//     //     last_login: new Date(),
//     //   });
//     // }

//     // res.json(user);


//      logger.info('User data:', users.length);
//       res.json(users);

// })

router.get('/users', authMiddleware, asyncHandler(async (req, res) => {
  const realm = req?.query.realm;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search?.toLowerCase() || '';
  const sortBy = req.query.sortBy || 'username';
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  if (!realm) throw new AppError('Invalid realm', 400, 'INVALID_REALM');

  try {
    const kc = await getKeycloakService(realm);
    const allUsers = await kc.getAllUser();

    let filteredUsers = allUsers;

    // Search
    if (search) {
      filteredUsers = filteredUsers.filter(user =>
        user.username?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.firstName?.toLowerCase().includes(search) ||
        user.lastName?.toLowerCase().includes(search)
      );
    }

    // Sort
    filteredUsers.sort((a, b) => {
      const aVal = a[sortBy]?.toLowerCase?.() || '';
      const bVal = b[sortBy]?.toLowerCase?.() || '';
      if (aVal < bVal) return -1 * sortOrder;
      if (aVal > bVal) return 1 * sortOrder;
      return 0;
    });

    // Paginate
    const start = (page - 1) * limit;
    const paginated = filteredUsers.slice(start, start + limit);

    return ResponseHandler.paginated(res, paginated, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredUsers.length
    }, 'Users fetched successfully');
  } catch (err) {
    logger.error('Error fetching users:', err);
    if (err instanceof AppError) throw err;
    throw new AppError('Failed to fetch users', 500, 'FETCH_FAILED', { originalError: err.message });
  }
}));

router.post('/users', authMiddleware, asyncHandler(async (req, res) => {
  const { realm, username, email, firstName, lastName, password, org_id, designation, department, avatar_url, mobile, gender } = req.body;
  logger.info(username);

  if (!realm || !username || !email || !password || !org_id) {
    throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
  }

  try {
    const kc = await getKeycloakService(realm);
    const user = await kc.createUser({ username, email, firstName, lastName, password, org_id });

    await UserMetadata.create({
      keycloak_id: user.id,
      org_id,
      designation,
      department,
      avatar_url,
      mobile,
      gender,
      is_active: true,
    });

    await AuditService.log({
      action: 'USER_CREATE',
      userId: user.id,
      orgId: org_id,
      metadata: { username, email, org_id },
    });

    return ResponseHandler.created(res, { userId: user.id }, `User ${username} created`);
  } catch (err) {
    logger.error('User creation error:', err);
    if (err instanceof AppError) throw err;
    throw new AppError('Failed to create user', 500, 'CREATION_FAILED', { originalError: err.message });
  }
}));

router.get('/user', authMiddleware, asyncHandler(async (req, res) => {
  try {

    const user = req.user; // Set by authMiddleware after verifying JWT

    logger.info('inside user', user);

    const userData = {
      id: user.sub,
      email: user.email,
      name: user.name || user.preferred_username,
      roles: user.realm_access?.roles || [],
      tenant_id: user.tenant_id || null,
    };
    logger.info('User data:', userData);
    return ResponseHandler.success(res, userData, 'User profile fetched successfully');
  } catch (e) {
    logger.error('Error fetching user:', e);

    if (e instanceof AppError) throw e;
    throw new AppError('Failed to fetch user data', 500, 'FETCH_FAILED', { originalError: e.message });
  }
}));

router.get('/users/:userId', asyncHandler(async (req, res) => {
  logger.info('cppp')
  const { userId } = req.params;
  const { realm } = req.query;
  if (!realm) {
    throw new AppError('Missing realm', 400, 'MISSING_REALM');
  }

  try {
    const kc = await getKeycloakService(realm);
    const user = await kc.getUser(userId);
    const metadata = await UserMetadata.findOne({ where: { keycloak_id: userId } });

    logger.info("user")
    logger.info(user);
    logger.info(metadata);

    await AuditService.log({
      action: 'USER_READ',
      userId: userId,
      orgId: metadata?.org_id || null,
      metadata: { username: user.username, email: user.email },
    });

    return ResponseHandler.success(res, {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      enabled: user.enabled,
      org_id: user.attributes?.tenant_id || metadata?.org_id,
      ...metadata?.dataValues,
    }, 'User details fetched successfully');
  } catch (err) {
    logger.error('User retrieval error:', err);
    if (err instanceof AppError) throw err;
    throw new AppError('User not found', 404, 'NOT_FOUND', { originalError: err.message });
  }
}));

router.put('/users/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { realm, username, email, firstName, lastName, enabled, org_id, designation, department, avatar_url, mobile, gender } = req.body;
  if (!realm || !org_id) {
    throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
  }

  try {
    const kc = await getKeycloakService(realm);
    await kc.updateUser(userId, { username, email, firstName, lastName, enabled, org_id });

    await UserMetadata.update(
      {
        org_id,
        designation,
        department,
        avatar_url,
        mobile,
        gender,
        updated_at: new Date(),
      },
      { where: { keycloak_id: userId } }
    );

    await AuditService.log({
      action: 'USER_UPDATE',
      userId: userId,
      orgId: org_id || null,
      metadata: { username, email, org_id },
    });

    return ResponseHandler.success(res, null, `User ${userId} updated`);
  } catch (err) {
    logger.error('User update error:', err);
    if (err instanceof AppError) throw err;
    throw new AppError('Failed to update user', 500, 'UPDATE_FAILED', { originalError: err.message });
  }
}));

router.delete('/users/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { realm } = req.query;
  if (!realm) {
    throw new AppError('Missing realm', 400, 'MISSING_REALM');
  }

  try {
    const kc = await getKeycloakService(realm);
    await kc.deleteUser(userId);

    await UserMetadata.destroy({ where: { keycloak_id: userId } });
    await TenantMapping.destroy({ where: { user_id: userId } });

    await AuditService.log({
      action: 'USER_DELETE',
      userId: userId,
    });

    return ResponseHandler.success(res, null, `User ${userId} deleted`);
  } catch (err) {
    logger.error('User deletion error:', err);
    if (err instanceof AppError) throw err;
    throw new AppError('Failed to delete user', 500, 'DELETION_FAILED', { originalError: err.message });
  }
}));

router.post('/users/:userId/roles', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { realm, role_name, client_id } = req.body;
  if (!realm || !role_name || !client_id) {
    throw new AppError('Missing required fields', 400, 'MISSING_FIELDS');
  }

  try {
    const kc = await getKeycloakService(realm);
    await kc.assignRole(userId, role_name, client_id);

    await AuditService.log({
      action: 'ROLE_ASSIGN',
      userId: userId,
      clientId: client_id,
      metadata: { role_name },
    });

    return ResponseHandler.success(res, null, `Role ${role_name} assigned to user ${userId}`);
  } catch (err) {
    logger.error('Role assignment error:', err);
    if (err instanceof AppError) throw err;
    throw new AppError('Failed to assign role', 500, 'ASSIGNMENT_FAILED', { originalError: err.message });
  }
}));


// router.get('/audit-logs', authMiddleware, requireSuperAdmin(), async (req, res) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;
//     const offset = (parseInt(page) - 1) * parseInt(limit);

//     const { count, rows } = await AuditLog.findAndCountAll({
//       limit: parseInt(limit),
//       offset: offset,
//       order: [['created_at', 'DESC']],
//     });

//     res.status(200).json({ count, rows });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });
// module.exports = router;

router.get('/audit-logs', authMiddleware, requireSuperAdmin(), asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = search
      ? {
        [Sequelize.Op.or]: [
          { action: { [Sequelize.Op.iLike]: `%${search}%` } },
          { user_id: { [Sequelize.Op.iLike]: `%${search}%` } },
          { client_id: { [Sequelize.Op.iLike]: `%${search}%` } },
          { org_id: { [Sequelize.Op.iLike]: `%${search}%` } },
        ],
      }
      : {};

    const { count, rows } = await AuditLog.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    return ResponseHandler.paginated(res, rows, {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count
    }, 'Audit logs fetched successfully');
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch audit logs', 500, 'FETCH_FAILED', { originalError: error.message });
  }
}));

router.get('/realm', asyncHandler(async (req, res) => {
  try {
    const kc = await getKeycloakService('master')
    const realms = await kc.getRealms();
    return ResponseHandler.success(res, realms, 'Realms fetched successfully');
  } catch (error) {
    logger.error('Failed to fetch realms', { error: error.message });
    throw new AppError('Failed to fetch realms', 500, 'FETCH_FAILED');
  }
}));
module.exports = router;