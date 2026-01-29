// config/auditConfig.js - Enterprise Audit Logging Configuration

/**
 * Enterprise audit logging configuration
 * Can be overridden via environment variables
 */
const auditConfig = {
  // Enable/disable audit logging
  enabled: process.env.AUDIT_ENABLED !== 'false', // Default: true
  
  // Log levels to capture
  logLevels: {
    success: process.env.AUDIT_LOG_SUCCESS !== 'false', // Default: true
    failure: process.env.AUDIT_LOG_FAILURE !== 'false', // Default: true
    errors: process.env.AUDIT_LOG_ERRORS !== 'false', // Default: true
  },
  
  // Paths to exclude from audit logging
  excludePaths: [
    '/health',
    '/metrics',
    '/favicon.ico',
    '/robots.txt',
    ...(process.env.AUDIT_EXCLUDE_PATHS ? process.env.AUDIT_EXCLUDE_PATHS.split(',') : [])
  ],
  
  // Sensitive fields to sanitize (never log these)
  sensitiveFields: [
    'password',
    'passwordHash',
    'password_hash',
    'secret',
    'secretKey',
    'secret_key',
    'token',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'apiKey',
    'api_key',
    'privateKey',
    'private_key',
    'clientSecret',
    'client_secret',
    'authorization',
    'authorizationHeader',
    'cookie',
    'session',
    'sessionId',
    'session_id',
    'otp',
    'otpCode',
    'otp_code',
    'mfaCode',
    'mfa_code',
    'verificationCode',
    'verification_code',
  ],
  
  // Retry configuration for failed audit log writes
  retry: {
    enabled: process.env.AUDIT_RETRY_ENABLED !== 'false', // Default: true
    maxAttempts: parseInt(process.env.AUDIT_RETRY_MAX_ATTEMPTS || '3'),
    delayMs: parseInt(process.env.AUDIT_RETRY_DELAY_MS || '1000'),
  },
  
  // Log retention policy (in days)
  retention: {
    enabled: process.env.AUDIT_RETENTION_ENABLED === 'true', // Default: false
    days: parseInt(process.env.AUDIT_RETENTION_DAYS || '365'),
  },
  
  // Service configuration
  service: {
    name: process.env.SERVICE_NAME || 'auth-service',
    nodeId: process.env.NODE_ID || require('os').hostname(),
    environment: process.env.NODE_ENV || 'development',
  },
  
  // Risk scoring configuration
  riskScoring: {
    enabled: process.env.AUDIT_RISK_SCORING_ENABLED !== 'false', // Default: true
    defaultScore: parseInt(process.env.AUDIT_DEFAULT_RISK_SCORE || '0'),
    // Risk score thresholds
    thresholds: {
      low: parseInt(process.env.AUDIT_RISK_LOW || '30'),
      medium: parseInt(process.env.AUDIT_RISK_MEDIUM || '60'),
      high: parseInt(process.env.AUDIT_RISK_HIGH || '80'),
    },
  },
  
  // Compliance tags
  compliance: {
    tags: process.env.AUDIT_COMPLIANCE_TAGS 
      ? process.env.AUDIT_COMPLIANCE_TAGS.split(',').map(t => t.trim())
      : ['GDPR', 'SOC2', 'ISO27001'],
    dataClassification: {
      default: process.env.AUDIT_DEFAULT_DATA_CLASSIFICATION || 'INTERNAL',
      sensitiveActions: ['PASSWORD_CHANGE', 'PASSWORD_RESET', 'USER_DELETE'],
    },
  },
  
  // Category mapping for actions
  categoryMapping: {
    'AUTH_': 'AUTH',
    'USER_': 'USER_MANAGEMENT',
    'SECURITY_': 'SECURITY',
    'ROLE_': 'AUTHORIZATION',
    'PERMISSION_': 'AUTHORIZATION',
    'ORG_': 'ADMIN',
    'API_': 'API',
    'SYSTEM_': 'SYSTEM',
  },
  
  // Severity mapping based on action and status
  severityMapping: {
    'CRITICAL_ACTIONS': ['USER_DELETE', 'ROLE_DELETE', 'PERMISSION_DELETE', 'ORG_DELETE'],
    'WARNING_ACTIONS': ['PASSWORD_CHANGE', 'PASSWORD_RESET', 'ROLE_UPDATE', 'PERMISSION_UPDATE'],
    'ERROR_STATUS': ['FAILURE', 'ERROR'],
  },
  
  // Future integrations
  integrations: {
    // Kafka integration (future)
    kafka: {
      enabled: process.env.AUDIT_KAFKA_ENABLED === 'true',
      topic: process.env.AUDIT_KAFKA_TOPIC || 'audit-logs',
    },
    // Redis integration (future)
    redis: {
      enabled: process.env.AUDIT_REDIS_ENABLED === 'true',
      keyPrefix: process.env.AUDIT_REDIS_PREFIX || 'audit:',
    },
    // S3 for cold storage (future)
    s3: {
      enabled: process.env.AUDIT_S3_ENABLED === 'true',
      bucket: process.env.AUDIT_S3_BUCKET || 'audit-logs',
    },
    // OpenTelemetry (future)
    opentelemetry: {
      enabled: process.env.AUDIT_OTEL_ENABLED === 'true',
    },
    // ELK Stack (future)
    elk: {
      enabled: process.env.AUDIT_ELK_ENABLED === 'true',
      endpoint: process.env.AUDIT_ELK_ENDPOINT || 'http://localhost:9200',
    },
    // Datadog (future)
    datadog: {
      enabled: process.env.AUDIT_DATADOG_ENABLED === 'true',
      apiKey: process.env.DATADOG_API_KEY,
    },
  },
  
  // Performance settings
  performance: {
    // Use async inserts to minimize impact
    asyncInsert: process.env.AUDIT_ASYNC_INSERT !== 'false', // Default: true
    // Batch size for bulk inserts (future)
    batchSize: parseInt(process.env.AUDIT_BATCH_SIZE || '100'),
  },
  
  // Geo-location settings
  geoLocation: {
    enabled: process.env.AUDIT_GEO_ENABLED !== 'false', // Default: true
    provider: process.env.AUDIT_GEO_PROVIDER || 'ip-api', // ip-api, maxmind, etc.
  },
};

module.exports = auditConfig;







