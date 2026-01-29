'use strict';
const { Model, DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { AppError } = require('../middleware/errorHandler');

module.exports = (sequelize) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.Client, { foreignKey: 'client_id', targetKey: 'client_id' });
    }

    /**
     * Calculate immutable hash for tamper detection
     * Hash includes all critical fields to detect any modifications
     */
    static calculateImmutableHash(data) {
      const hashableFields = [
        data.uuid,
        data.timestamp?.toISOString(),
        data.user_id,
        data.org_id,
        data.client_id,
        data.action,
        data.category,
        data.status,
        data.message,
        JSON.stringify(data.metadata || {}),
        data.source_ip,
        data.affected_entity_type,
        data.affected_entity_id,
      ].filter(Boolean).join('|');

      return crypto.createHash('sha256').update(hashableFields).digest('hex');
    }
  }

  AuditLog.init(
    {
      // Primary key (keep integer for compatibility)
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      // ========== CORE IDENTIFIERS ==========
      uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        // unique: true, // Removed to fix Sequelize sync error
        defaultValue: DataTypes.UUIDV4,
        // comment: 'Unique audit log identifier', // Removed for safety
      },
      org_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Organization/Tenant ID',
      },
      user_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'User performing the action',
      },
      client_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'App or integration client ID',
      },
      session_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Session or token identifier',
      },
      request_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Request UUID',
      },
      correlation_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Cross-service trace ID',
      },

      // ========== ACTION CONTEXT ==========
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Action type (e.g., USER_LOGIN, ROLE_UPDATE)',
      },
      category: {
        type: DataTypes.ENUM('AUTH', 'USER_MANAGEMENT', 'SECURITY', 'ADMIN', 'AUTHORIZATION', 'API', 'SYSTEM'),
        allowNull: true,

      },
       
      severity: {
        type: DataTypes.ENUM('INFO', 'WARNING', 'CRITICAL', 'ERROR'),
        allowNull: true,
        defaultValue: 'INFO',
        
      },
      status: {
        type: DataTypes.ENUM('SUCCESS', 'FAILURE', 'PENDING', 'ERROR'),
        allowNull: false,
        defaultValue: 'SUCCESS',
        
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Human-readable event summary',
      },
      details: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Legacy field - kept for backward compatibility',
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Contextual metadata (payload, params, results)',
      },

      // ========== ENVIRONMENT & SYSTEM CONTEXT ==========
      source_ip: {
        type: DataTypes.STRING(45), // IPv6 support
        allowNull: true,
        comment: 'Client IP address',
      },
      destination_ip: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'Destination IP (for internal hops)',
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Browser/client information',
      },
      geo_location: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Geographic location (lat, long, country, region)',
      },
      device_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Device fingerprint',
      },
      os: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Operating system',
      },
      browser: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Browser name and version',
      },
      environment: {
        type: DataTypes.ENUM('PRODUCTION', 'STAGING', 'DEVELOPMENT', 'TEST'),
        allowNull: true,
        defaultValue: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT',
        
      },
      service_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'auth-service',
       
      },

      // ========== SECURITY & COMPLIANCE ==========
      risk_score: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: { min: 0, max: 100 },
        comment: 'Risk level (0-100)',
      },
      compliance_tags: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Compliance tags (e.g., ["GDPR", "SOC2"])',
      },
      immutable_hash: {
        type: DataTypes.STRING(64),
        allowNull: true,
       
      },
      actor_type: {
        type: DataTypes.ENUM('USER', 'SYSTEM', 'SERVICE_ACCOUNT', 'API'),
        allowNull: true,
        defaultValue: 'USER',
      
      },
      affected_entity_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Target entity type (e.g., User, Role, Token)',
      },
      affected_entity_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Target entity ID',
      },
      auth_method: {
        type: DataTypes.ENUM('PASSWORD', 'OAUTH', 'API_KEY', 'JWT', 'SSO', 'MFA', 'UNKNOWN'),
        allowNull: true,
        // comment: 'Authentication method used',
      },
      privilege_level: {
        type: DataTypes.ENUM('USER', 'ADMIN', 'SUPER_ADMIN', 'SERVICE'),
        allowNull: true,
        // comment: 'Privilege level of the actor',
      },
      data_classification: {
        type: DataTypes.ENUM('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'),
        allowNull: true,
        defaultValue: 'INTERNAL',
        // comment: 'Data classification level',
      },

      // ========== OPERATIONAL METADATA ==========
      duration_ms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Execution time in milliseconds',
      },
      response_code: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'HTTP or system response code',
      },
      node_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: process.env.NODE_ID || require('os').hostname(),
        comment: 'Server instance identifier',
      },
      trace_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Distributed tracing ID',
      },
      span_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Span ID for distributed tracing',
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Event timestamp (UTC)',
      },
      inserted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Actual database write time',
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: 'Legacy timestamp field',
      },
    },
    {
      sequelize,
      modelName: 'AuditLog',
      tableName: 'audit_logs',
      timestamps: false,
      indexes: [
        { fields: ['org_id'] },
        { fields: ['user_id'] },
        { fields: ['client_id'] },
        { fields: ['action'] },
        { fields: ['uuid'], unique: true },
        { fields: ['timestamp'] },
        { fields: ['request_id'] },
        { fields: ['correlation_id'] },
        { fields: ['session_id'] },
        { fields: ['user_id', 'timestamp'] },
        { fields: ['org_id', 'timestamp'] },
        { fields: ['action', 'timestamp'] },
        { fields: ['category', 'severity'] },
        { fields: ['status'] },
        { fields: ['risk_score'] },
        { fields: ['affected_entity_type', 'affected_entity_id'] },
        { fields: ['trace_id'] },
        { fields: ['immutable_hash'] },
      ],
      hooks: {
        beforeCreate: async (auditLog) => {
          // Ensure UUID is set
          if (!auditLog.uuid) {
            auditLog.uuid = uuidv4();
          }

          // Ensure timestamp is set
          if (!auditLog.timestamp) {
            auditLog.timestamp = new Date();
          }

          // Ensure inserted_at is set
          if (!auditLog.inserted_at) {
            auditLog.inserted_at = new Date();
          }

          // Map details to metadata if metadata is empty
          if (!auditLog.metadata || Object.keys(auditLog.metadata).length === 0) {
            auditLog.metadata = auditLog.details || {};
          }

          // Calculate immutable hash for tamper detection
          if (!auditLog.immutable_hash) {
            auditLog.immutable_hash = AuditLog.calculateImmutableHash(auditLog);
          }
        },
        beforeUpdate: () => {
          // Prevent updates - audit logs are immutable
          throw new AppError('Audit logs are immutable and cannot be updated', 400, 'AUDIT_LOG_IMMUTABLE');
        },
        beforeDestroy: () => {
          // Prevent deletes - audit logs are immutable
          throw new AppError('Audit logs are immutable and cannot be deleted', 400, 'AUDIT_LOG_IMMUTABLE');
        },
      },
    }
  );

  return AuditLog;
};
