// Load env first and disable TLS verification for self-signed certs (Keycloak)
require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configure undici global dispatcher to accept self-signed HTTPS certificates
// This is required for Node.js native fetch to work with Keycloak's self-signed cert
const { setGlobalDispatcher, Agent } = require('undici');
setGlobalDispatcher(new Agent({
  connect: {
    rejectUnauthorized: false
  }
}));

const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
// const { createClient } = require('redis');
const { configurePassport } = require('./services/passport.service');
const session = require('express-session')
const cors = require('cors');
const cookieParser = require('cookie-parser')
const { startDeviceCleanupJob } = require('./jobs/device-cleanup.job');
const { auditMiddleware } = require('./middleware/auditMiddleware');

// Central router - aggregates all domain routes
// See routes/index.js for route organization

// const roleRoutes = require('./routes/roles');
// const tenantRoutes = require('./routes/tenants');
// const { REDIS_URL } = require('./config');
const { createLogger, format, transports } = require('winston');
const { getAllowedOriginsFromDB } = require('./services/client.service');
const { CORS_ORIGINS, DEFAULT_DEV_ORIGINS } = require('./config');

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()],
});

const {
  NODE_ENV,
  SESSION_SECRET,
  SESSION_COOKIE_DOMAIN,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_SECURE,
  SESSION_COOKIE_SAMESITE,
  TRUST_PROXY,
  // CORS_FALLBACK_ORIGINS - replaced by config.CORS_ORIGINS
} = process.env;

const isProduction = NODE_ENV === 'production';

const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(express.json());


// Honour reverse proxies (NGINX, ingress, etc.) so req.secure works correctly.
if (TRUST_PROXY !== 'false') {
  app.set('trust proxy', 1);
}

// Configured origins from environment + default dev origins
const extraConfiguredOrigins = CORS_ORIGINS;
const devOriginSet = new Set([...DEFAULT_DEV_ORIGINS, ...extraConfiguredOrigins]);

let cachedDbOrigins = [];
let lastOriginRefresh = 0;
const ORIGIN_CACHE_TTL = 60 * 1000; // 60 seconds

const resolveAllowedOrigins = () => {
  if (Date.now() - lastOriginRefresh < ORIGIN_CACHE_TTL && cachedDbOrigins.length) {
    return Promise.resolve(cachedDbOrigins);
  }

  return getAllowedOriginsFromDB()
    .then((origins) => {
      cachedDbOrigins = origins || [];
      lastOriginRefresh = Date.now();
      return cachedDbOrigins;
    })
    .catch((err) => {
      logger.error('Failed to load origins from DB', { error: err.message });
      return cachedDbOrigins;
    });
};

const corsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Client-Key',
    'X-Session-Id',
    'X-Org-Id',
    'X-Tenant-Id',
    'X-Refresh-Token',
    'Accept',
    'Origin'
  ],
  exposedHeaders: [
    'Authorization',
    'X-Client-Key',
    'X-Session-Id'
  ],
  optionsSuccessStatus: 204,
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    resolveAllowedOrigins()
      .then((allowedOrigins) => {
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        if (!isProduction && devOriginSet.has(origin)) {
          return callback(null, true);
        }

        logger.warn('CORS blocked origin', { origin, allowedOrigins });
        return callback(new Error('Not allowed by CORS'));
      })
      .catch((err) => {
        logger.error('CORS origin resolution failed', { origin, error: err.message });
        if (!isProduction) {
          return callback(null, true);
        }
        return callback(new Error('Internal server error'));
      });
  }
};

const corsMiddleware = cors(corsOptions);

// Ensure caches/proxies vary by Origin header for credentialed requests.
app.use((req, res, next) => {
  res.header('Vary', 'Origin');
  next();
});

app.use((req, res, next) => corsMiddleware(req, res, next));

const normalizeDomain = (value) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  // Browsers reject cookie domains for localhost-style hosts and bare IPs.
  if (
    lower === 'localhost' ||
    lower.endsWith('.localhost') ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(lower)
  ) {
    return undefined;
  }
  return trimmed;
};

const resolvedSessionDomain = normalizeDomain(SESSION_COOKIE_DOMAIN);

const shouldForceSecureCookies = (SESSION_COOKIE_SECURE || '').toLowerCase() === 'true';
const sessionCookieSecure = shouldForceSecureCookies || (isProduction && (TRUST_PROXY !== 'false'));

let sessionCookieSameSite = (SESSION_COOKIE_SAMESITE || '').toLowerCase();
if (!['none', 'lax', 'strict'].includes(sessionCookieSameSite)) {
  sessionCookieSameSite = sessionCookieSecure ? 'none' : 'lax';
}
if (sessionCookieSameSite === 'none' && !sessionCookieSecure) {
  // SameSite=None without secure is rejected by browsers – fall back to lax.
  sessionCookieSameSite = 'lax';
}

const sessionCookieName = SESSION_COOKIE_NAME || 'auth.sid';
const sessionSecret = SESSION_SECRET || 'change-me-in-env';

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
  })
);

// ✅ Simplified session configuration for HTTP development
// For HTTP: SameSite=lax works for same-site navigation
// For cross-site redirects (Keycloak on different domain), cookies won't be sent with HTTP
// Solution: Use HTTP for all services OR set up HTTPS
app.use(
  session({
    name: sessionCookieName,
    secret: sessionSecret,
    // ✅ Use default MemoryStore (in-memory, cleared on restart)
    // For production with multiple instances, use Redis or database-backed store
    resave: false, // Don't save session if unmodified
    saveUninitialized: true, // Create session for passport state storage
    rolling: true, // Reset expiration on activity
    cookie: {
      httpOnly: true,
      secure: sessionCookieSecure, // false for HTTP, true for HTTPS
      sameSite: sessionCookieSameSite, // 'lax' for HTTP, 'none' for HTTPS cross-site
      maxAge: 60 * 60 * 1000, // 1 hour
      domain: resolvedSessionDomain, // .local.test for subdomain sharing
    },
    genid: (req) => {
      // Generate secure session IDs
      return require('crypto').randomBytes(16).toString('hex');
    },
  })
);




app.use(passport.initialize());
app.use(passport.session());
startDeviceCleanupJob();

// ============================================================================
// Centralized Audit Logging
// Captures all API interactions across all routes
// ============================================================================
app.use(auditMiddleware());



// configurePassport();

// const redisClient = createClient({ url: REDIS_URL });
// redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));
// redisClient.connect().then(() => logger.info('Connected to Redis'));

// ============================================================================
// Health Check Endpoint (for Docker healthchecks)
// ============================================================================
const { sequelize } = require('./config/database');

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});

// ============================================================================
// Database Sync (creates tables if they don't exist)
// ============================================================================
(async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established');

    // Sync database (creates tables if they don't exist)
    // Use { alter: true } in development for schema changes
    // Use { force: false } in production to avoid data loss
    const syncOptions = NODE_ENV === 'development' ? { alter: true } : { alter: false };
    await sequelize.sync(syncOptions);
    logger.info('✅ Database synchronized');
  } catch (error) {
    logger.error('❌ Database connection failed:', { error: error.message });
    // Don't exit - let Docker health checks handle restart
  }
})();

// ============================================================================
// Central Router - All routes organized by domain
// See routes/index.js for complete route organization
// ============================================================================
app.use(require('./routes'));

// app.use('/tenants', tenantRoutes);

const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// ============================================================================
// HTTPS Server Configuration
// Uses mkcert certificates from keycloak-setup folder
// ============================================================================
const PORT = process.env.PORT || 4000;
const certPath = path.join(__dirname, '..', 'keycloak-setup', 'cert.pem');
const keyPath = path.join(__dirname, '..', 'keycloak-setup', 'key.pem');

// Check if certificates exist
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  // HTTPS mode
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    logger.info(`🔒 Auth service running on HTTPS port ${PORT}`);
  });
} else {
  // Fallback to HTTP if no certificates
  logger.warn('⚠️  No TLS certificates found. Running in HTTP mode.');
  logger.warn(`   Expected: ${certPath}`);
  logger.warn(`   Run: cd keycloak-setup && ./setup-https.sh`);

  app.listen(PORT, () => {
    logger.info(`Auth service running on HTTP port ${PORT}`);
  });
}

module.exports = {
  app,
  // redisClient 
};
