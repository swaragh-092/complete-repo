// services/audit.service.js - Enterprise Audit Logging Service

// IMPORTANT: Use lazy loading to avoid circular dependency with database.js
// The AuditLog model is loaded on first use, not at module load time
let _AuditLog = null;
let _sequelize = null;

function getAuditLog() {
  if (!_AuditLog) {
    const db = require('../config/database');
    _AuditLog = db.AuditLog;
    _sequelize = db.sequelize;
  }
  return _AuditLog;
}

function getSequelize() {
  if (!_sequelize) {
    const db = require('../config/database');
    _sequelize = db.sequelize;
  }
  return _sequelize;
}

const { Op } = require('sequelize');
const auditConfig = require('../config/auditConfig');
const logger = require('../utils/logger');
const UAParser = require('ua-parser-js');
const crypto = require('crypto');

class AuditService {
  /**
   * Sanitize sensitive data from objects
   * Removes passwords, tokens, secrets, and other sensitive fields
   */
  static sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Check if this is a sensitive field
      if (auditConfig.sensitiveFields.some(field =>
        lowerKey.includes(field.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Recursively sanitize nested objects
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Determine category from action name
   */
  static determineCategory(action) {
    for (const [prefix, category] of Object.entries(auditConfig.categoryMapping)) {
      if (action.startsWith(prefix)) {
        return category;
      }
    }
    return 'SYSTEM';
  }

  /**
   * Determine severity from action and status
   */
  static determineSeverity(action, status) {
    // Critical actions
    if (auditConfig.severityMapping.CRITICAL_ACTIONS.some(a => action.includes(a))) {
      return 'CRITICAL';
    }

    // Error status
    if (auditConfig.severityMapping.ERROR_STATUS.includes(status)) {
      return 'ERROR';
    }

    // Warning actions
    if (auditConfig.severityMapping.WARNING_ACTIONS.some(a => action.includes(a))) {
      return 'WARNING';
    }

    return 'INFO';
  }

  /**
   * Calculate risk score based on action, status, and context
   */
  static calculateRiskScore(action, status, context = {}) {
    if (!auditConfig.riskScoring.enabled) {
      return auditConfig.riskScoring.defaultScore;
    }

    let score = auditConfig.riskScoring.defaultScore;

    // Increase risk for failed operations
    if (status === 'FAILURE' || status === 'ERROR') {
      score += 20;
    }

    // Increase risk for critical actions
    if (auditConfig.severityMapping.CRITICAL_ACTIONS.some(a => action.includes(a))) {
      score += 30;
    }

    // Increase risk for security-related actions
    if (action.includes('SECURITY_') || action.includes('PASSWORD')) {
      score += 15;
    }

    // Increase risk for admin actions
    if (action.includes('ADMIN_') || action.includes('SUPER_ADMIN')) {
      score += 10;
    }

    // Increase risk for new device/login from unknown location
    if (context.newDevice) {
      score += 25;
    }

    if (context.unknownLocation) {
      score += 15;
    }

    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Extract device information from user agent
   */
  static extractDeviceInfo(userAgent) {
    if (!userAgent) return {};

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      os: result.os?.name || null,
      osVersion: result.os?.version || null,
      browser: result.browser?.name || null,
      browserVersion: result.browser?.version || null,
      device: result.device?.model || null,
      deviceType: result.device?.type || 'desktop',
    };
  }

  /**
   * Get geo location from IP (simplified - can be enhanced with external service)
   */
  static async getGeoLocation(ip) {
    if (!auditConfig.geoLocation.enabled || !ip || ip === 'unknown') {
      return null;
    }

    // TODO: Integrate with IP geolocation service (ip-api, MaxMind, etc.)
    // For now, return basic structure
    return {
      ip,
      // country: 'Unknown',
      // region: 'Unknown',
      // city: 'Unknown',
      // lat: null,
      // long: null,
    };
  }

  /**
   * Determine data classification based on action
   */
  static determineDataClassification(action) {
    if (auditConfig.compliance.dataClassification.sensitiveActions.some(a => action.includes(a))) {
      return 'CONFIDENTIAL';
    }
    return auditConfig.compliance.dataClassification.default;
  }

  /**
   * Retry logic for failed audit log writes
   */
  static async retryOperation(operation, maxAttempts = 3, delayMs = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * Main audit logging method with all enterprise fields
   * @param {Object} options - Comprehensive audit log options
   */
  static async log({
    // Core Identifiers
    action,
    userId = null,
    orgId = null,
    clientId = null,
    sessionId = null,
    requestId = null,
    correlationId = null,

    // Action Context
    category = null,
    severity = null,
    status = 'SUCCESS',
    message = null,
    metadata = {},

    // Environment & System Context
    sourceIP = null,
    destinationIP = null,
    userAgent = null,
    geoLocation = null,
    deviceId = null,
    os = null,
    browser = null,
    environment = null,
    serviceName = null,

    // Security & Compliance
    riskScore = null,
    complianceTags = null,
    actorType = 'USER',
    affectedEntityType = null,
    affectedEntityId = null,
    authMethod = null,
    privilegeLevel = null,
    dataClassification = null,

    // Operational Metadata
    durationMs = null,
    responseCode = null,
    nodeId = null,
    traceId = null,
    spanId = null,
    timestamp = null,
  }) {
    // Check if audit logging is enabled
    if (!auditConfig.enabled) {
      return;
    }

    try {
      // Auto-determine fields if not provided
      const finalCategory = category || this.determineCategory(action);
      const finalSeverity = severity || this.determineSeverity(action, status);
      const finalRiskScore = riskScore !== null
        ? riskScore
        : this.calculateRiskScore(action, status, metadata);
      const finalDataClassification = dataClassification || this.determineDataClassification(action);

      // Extract device info from user agent if not provided
      let deviceInfo = {};
      if (userAgent && (!os || !browser)) {
        deviceInfo = this.extractDeviceInfo(userAgent);
      }

      // Get geo location if enabled and not provided
      let finalGeoLocation = geoLocation;
      if (!finalGeoLocation && sourceIP && auditConfig.geoLocation.enabled) {
        finalGeoLocation = await this.getGeoLocation(sourceIP);
      }

      // Sanitize metadata to remove sensitive data
      const sanitizedMetadata = this.sanitizeData(metadata);

      // Prepare audit log data
      const auditData = {
        // Core Identifiers
        user_id: userId,
        org_id: orgId,
        client_id: clientId,
        session_id: sessionId,
        request_id: requestId,
        correlation_id: correlationId || requestId,

        // Action Context
        action: action.toUpperCase(),
        category: finalCategory,
        severity: finalSeverity,
        status: status.toUpperCase(),
        message: message || `${action} - ${status}`,
        metadata: sanitizedMetadata,
        details: sanitizedMetadata, // Legacy compatibility

        // Environment & System Context
        source_ip: sourceIP,
        destination_ip: destinationIP,
        user_agent: userAgent,
        geo_location: finalGeoLocation,
        device_id: deviceId,
        os: os || deviceInfo.os,
        browser: browser || deviceInfo.browser,
        environment: environment || auditConfig.service.environment.toUpperCase(),
        service_name: serviceName || auditConfig.service.name,

        // Security & Compliance
        risk_score: finalRiskScore,
        compliance_tags: complianceTags || auditConfig.compliance.tags,
        actor_type: actorType,
        affected_entity_type: affectedEntityType,
        affected_entity_id: affectedEntityId,
        auth_method: authMethod,
        privilege_level: privilegeLevel,
        data_classification: finalDataClassification,

        // Operational Metadata
        duration_ms: durationMs,
        response_code: responseCode,
        node_id: nodeId || auditConfig.service.nodeId,
        trace_id: traceId,
        span_id: spanId,
        timestamp: timestamp || new Date(),
        inserted_at: new Date(),
      };

      // Use async insert if configured
      if (auditConfig.performance.asyncInsert) {
        // Fire and forget - don't await
        this.insertAuditLog(auditData).catch(err => {
          logger.error('Async audit log insert failed', {
            error: err.message,
            action: auditData.action,
            category: auditData.category,
            status: auditData.status,
            severity: auditData.severity,
            auth_method: auditData.auth_method,
            privilege_level: auditData.privilege_level,
            actor_type: auditData.actor_type,
            stack: err.stack?.split('\n').slice(0, 3).join('\n'),
            parentError: err.parent?.message,
            validationErrors: err.errors?.map(e => ({ field: e.path, type: e.type, message: e.message })),
          });
        });
      } else {
        // Synchronous insert with retry
        if (auditConfig.retry.enabled) {
          await this.retryOperation(
            () => getAuditLog().create(auditData),
            auditConfig.retry.maxAttempts,
            auditConfig.retry.delayMs
          );
        } else {
          await getAuditLog().create(auditData);
        }
      }
    } catch (error) {
      // Don't throw - audit logging should never break the main flow
      logger.error('Audit logging failed', {
        error: error.message,
        action,
        userId,
        stack: error.stack,
      });
    }
  }

  /**
   * Internal method for async audit log insertion
   */
  static async insertAuditLog(auditData) {
    // DEBUG: Log what we're trying to insert
    console.log('🔍 [AUDIT DEBUG] Attempting to insert audit log:');
    console.log('  Action:', auditData.action);
    console.log('  Category:', auditData.category);
    console.log('  Status:', auditData.status);
    console.log('  Severity:', auditData.severity);
    console.log('  Auth Method:', auditData.auth_method);
    console.log('  Privilege Level:', auditData.privilege_level);
    console.log('  Actor Type:', auditData.actor_type);
    console.log('  Environment:', auditData.environment);
    console.log('  Data Classification:', auditData.data_classification);

    try {
      let result;
      if (auditConfig.retry.enabled) {
        result = await this.retryOperation(
          () => getAuditLog().create(auditData),
          auditConfig.retry.maxAttempts,
          auditConfig.retry.delayMs
        );
      } else {
        result = await getAuditLog().create(auditData);
      }
      console.log('✅ [AUDIT DEBUG] Insert succeeded, ID:', result.id);
      return result;
    } catch (err) {
      console.error('❌ [AUDIT DEBUG] Insert FAILED:');
      console.error('  Error Message:', err.message);
      console.error('  Error Name:', err.name);
      if (err.parent) {
        console.error('  DB Error:', err.parent.message);
        console.error('  DB Detail:', err.parent.detail);
      }
      if (err.errors) {
        console.error('  Validation Errors:');
        err.errors.forEach(e => {
          console.error(`    - Field: ${e.path}, Type: ${e.type}, Value: ${e.value}, Message: ${e.message}`);
        });
      }
      console.error('  Full auditData:', JSON.stringify(auditData, null, 2));
      throw err;
    }
  }

  /**
   * Convenience methods for specific event types
   */
  static async logAuth(action, userId, options = {}) {
    const {
      ipAddress,
      userAgent,
      clientId,
      sessionId,
      status = 'SUCCESS',
      errorMessage = null,
      requestId = null,
      correlationId = null,
      traceId = null,
      spanId = null,
      authMethod = 'PASSWORD',
      metadata = {},
      durationMs = null,
    } = options;

    return this.log({
      action: `AUTH_${action}`,
      userId,
      clientId,
      sessionId,
      requestId,
      correlationId,
      traceId,
      spanId,
      status: errorMessage ? 'FAILURE' : status,
      sourceIP: ipAddress,
      userAgent,
      authMethod,
      durationMs,
      affectedEntityType: 'USER',
      affectedEntityId: userId,
      message: errorMessage || `${action} successful`,
      metadata: {
        ...metadata,
        type: 'authentication',
        ...(errorMessage && { error: errorMessage }),
      },
    });
  }

  static async logUser(action, userId, options = {}) {
    const {
      entityId,
      ipAddress,
      userAgent,
      clientId,
      requestId = null,
      correlationId = null,
      status = 'SUCCESS',
      metadata = {},
      privilegeLevel = null,
    } = options;

    return this.log({
      action: `USER_${action}`,
      userId,
      entityId: entityId || userId,
      clientId,
      requestId,
      correlationId,
      status,
      sourceIP: ipAddress,
      userAgent,
      affectedEntityType: 'USER',
      affectedEntityId: entityId || userId,
      privilegeLevel,
      metadata: {
        ...metadata,
        type: 'user_management',
      },
    });
  }

  static async logRole(action, userId, options = {}) {
    const {
      roleId,
      roleName,
      ipAddress,
      userAgent,
      clientId,
      requestId = null,
      status = 'SUCCESS',
      metadata = {},
    } = options;

    return this.log({
      action: `ROLE_${action}`,
      userId,
      entityId: roleId || roleName,
      clientId,
      requestId,
      status,
      sourceIP: ipAddress,
      userAgent,
      affectedEntityType: 'ROLE',
      affectedEntityId: roleId || roleName,
      metadata: {
        ...metadata,
        type: 'role',
        roleName,
      },
    });
  }

  static async logPermission(action, userId, options = {}) {
    const {
      permissionId,
      permissionName,
      ipAddress,
      userAgent,
      clientId,
      requestId = null,
      status = 'SUCCESS',
      metadata = {},
    } = options;

    return this.log({
      action: `PERMISSION_${action}`,
      userId,
      entityId: permissionId || permissionName,
      clientId,
      requestId,
      status,
      sourceIP: ipAddress,
      userAgent,
      affectedEntityType: 'PERMISSION',
      affectedEntityId: permissionId || permissionName,
      metadata: {
        ...metadata,
        type: 'permission',
        permissionName,
      },
    });
  }

  /**
   * Get audit logs with comprehensive filters
   */
  static async getLogs({
    userId = null,
    orgId = null,
    clientId = null,
    action = null,
    category = null,
    severity = null,
    status = null,
    affectedEntityType = null,
    affectedEntityId = null,
    startDate = null,
    endDate = null,
    requestId = null,
    correlationId = null,
    minRiskScore = null,
    maxRiskScore = null,
    page = 1,
    limit = 50,
    search = null,
  }) {
    const where = {};

    if (userId) where.user_id = userId;
    if (orgId) where.org_id = orgId;
    if (clientId) where.client_id = clientId;
    if (action) where.action = { [Op.iLike]: `%${action}%` };
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (status) where.status = status.toUpperCase();
    if (affectedEntityType) where.affected_entity_type = affectedEntityType;
    if (affectedEntityId) where.affected_entity_id = affectedEntityId;
    if (requestId) where.request_id = requestId;
    if (correlationId) where.correlation_id = correlationId;

    if (minRiskScore !== null || maxRiskScore !== null) {
      where.risk_score = {};
      if (minRiskScore !== null) where.risk_score[Op.gte] = minRiskScore;
      if (maxRiskScore !== null) where.risk_score[Op.lte] = maxRiskScore;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp[Op.gte] = new Date(startDate);
      if (endDate) where.timestamp[Op.lte] = new Date(endDate);
    }

    if (search) {
      where[Op.or] = [
        { action: { [Op.iLike]: `%${search}%` } },
        { message: { [Op.iLike]: `%${search}%` } },
        { user_id: { [Op.iLike]: `%${search}%` } },
        { client_id: { [Op.iLike]: `%${search}%` } },
        { org_id: { [Op.iLike]: `%${search}%` } },
        { affected_entity_type: { [Op.iLike]: `%${search}%` } },
        { affected_entity_id: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await getAuditLog().findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['timestamp', 'DESC']],
    });

    return {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      data: rows,
    };
  }

  /**
   * Get user's login history
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   */
  static async getUserLoginHistory(userId, limit = 50) {
    const AuditLog = getAuditLog();

    const logs = await AuditLog.findAll({
      where: {
        user_id: userId,
        action: {
          [Op.or]: [
            { [Op.iLike]: '%LOGIN%' },
            { [Op.iLike]: '%LOGOUT%' },
            { [Op.iLike]: '%AUTH_%' },
          ],
        },
      },
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
    });

    return logs.map(log => ({
      id: log.id,
      action: log.action,
      status: log.status,
      timestamp: log.timestamp,
      ipAddress: log.source_ip,
      userAgent: log.user_agent,
      location: log.geo_location,
      browser: log.browser,
      os: log.os,
      deviceType: log.metadata?.deviceType || 'desktop',
      clientId: log.client_id,
      sessionId: log.session_id,
      authMethod: log.auth_method,
      message: log.message,
    }));
  }

  /**
   * Get user's security-related events
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   */
  static async getUserSecurityEvents(userId, limit = 50) {
    const AuditLog = getAuditLog();

    const logs = await AuditLog.findAll({
      where: {
        user_id: userId,
        [Op.or]: [
          { category: 'SECURITY' },
          { action: { [Op.iLike]: '%PASSWORD%' } },
          { action: { [Op.iLike]: '%MFA%' } },
          { action: { [Op.iLike]: '%2FA%' } },
          { action: { [Op.iLike]: '%SECURITY%' } },
          { action: { [Op.iLike]: '%DEVICE%' } },
          { action: { [Op.iLike]: '%SESSION_TERMINATE%' } },
          { severity: { [Op.in]: ['CRITICAL', 'ERROR', 'WARNING'] } },
        ],
      },
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
    });

    return logs.map(log => ({
      id: log.id,
      action: log.action,
      category: log.category,
      severity: log.severity,
      status: log.status,
      timestamp: log.timestamp,
      ipAddress: log.source_ip,
      userAgent: log.user_agent,
      location: log.geo_location,
      riskScore: log.risk_score,
      message: log.message,
      details: log.metadata,
    }));
  }

  /**
   * Get logs by correlation ID for distributed tracing
   */
  static async getLogsByCorrelationId(correlationId) {
    return await getAuditLog().findAll({
      where: { correlation_id: correlationId },
      order: [['timestamp', 'ASC']],
    });
  }

  /**
   * Get logs by trace ID for distributed tracing
   */
  static async getLogsByTraceId(traceId) {
    return await getAuditLog().findAll({
      where: { trace_id: traceId },
      order: [['timestamp', 'ASC']],
    });
  }
}

module.exports = AuditService;
