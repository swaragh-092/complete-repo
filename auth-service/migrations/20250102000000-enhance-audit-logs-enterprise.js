'use strict';

/**
 * Enterprise-Level Audit Logs Migration
 * Adds comprehensive fields for compliance, security, and operational monitoring
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // ========== CORE IDENTIFIERS ==========
      
      // Change id to UUID (if not already)
      // Note: We'll keep the integer id as primary key and add uuid as unique identifier
      await queryInterface.addColumn('audit_logs', 'uuid', {
        type: Sequelize.UUID,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'session_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Session or token identifier',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'request_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Request UUID',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'correlation_id', {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Cross-service trace ID',
      }, { transaction });

      // ========== ACTION CONTEXT ==========
      
      await queryInterface.addColumn('audit_logs', 'category', {
        type: Sequelize.ENUM('AUTH', 'USER_MANAGEMENT', 'SECURITY', 'ADMIN', 'AUTHORIZATION', 'API', 'SYSTEM'),
        allowNull: true,
        comment: 'Logical group for actions',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'severity', {
        type: Sequelize.ENUM('INFO', 'WARNING', 'CRITICAL', 'ERROR'),
        allowNull: true,
        defaultValue: 'INFO',
        comment: 'Event severity level',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'status', {
        type: Sequelize.ENUM('SUCCESS', 'FAILURE', 'PENDING', 'ERROR'),
        allowNull: true,
        defaultValue: 'SUCCESS',
        comment: 'Action status',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'message', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Human-readable event summary',
      }, { transaction });

      // Rename details to metadata and keep details for backward compatibility
      await queryInterface.addColumn('audit_logs', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Contextual metadata (payload, params, results)',
      }, { transaction });

      // ========== ENVIRONMENT & SYSTEM CONTEXT ==========
      
      await queryInterface.addColumn('audit_logs', 'source_ip', {
        type: Sequelize.STRING(45), // IPv6 support
        allowNull: true,
        comment: 'Client IP address',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'destination_ip', {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'Destination IP (for internal hops)',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'user_agent', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Browser/client information',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'geo_location', {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Geographic location (lat, long, country, region)',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'device_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Device fingerprint',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'os', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Operating system',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'browser', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Browser name and version',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'environment', {
        type: Sequelize.ENUM('PRODUCTION', 'STAGING', 'DEVELOPMENT', 'TEST'),
        allowNull: true,
        defaultValue: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT',
        comment: 'Environment name',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'service_name', {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: 'auth-service',
        comment: 'Service identifier',
      }, { transaction });

      // ========== SECURITY & COMPLIANCE ==========
      
      await queryInterface.addColumn('audit_logs', 'risk_score', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Risk level (0-100)',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'compliance_tags', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Compliance tags (e.g., ["GDPR", "SOC2"])',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'immutable_hash', {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: 'SHA-256 hash for tamper detection',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'actor_type', {
        type: Sequelize.ENUM('USER', 'SYSTEM', 'SERVICE_ACCOUNT', 'API'),
        allowNull: true,
        defaultValue: 'USER',
        comment: 'Type of actor performing the action',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'affected_entity_type', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Target entity type (e.g., User, Role, Token)',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'affected_entity_id', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Target entity ID',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'auth_method', {
        type: Sequelize.ENUM('PASSWORD', 'OAUTH', 'API_KEY', 'JWT', 'SSO', 'MFA', 'UNKNOWN'),
        allowNull: true,
        comment: 'Authentication method used',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'privilege_level', {
        type: Sequelize.ENUM('USER', 'ADMIN', 'SUPER_ADMIN', 'SERVICE'),
        allowNull: true,
        comment: 'Privilege level of the actor',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'data_classification', {
        type: Sequelize.ENUM('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'),
        allowNull: true,
        defaultValue: 'INTERNAL',
        comment: 'Data classification level',
      }, { transaction });

      // ========== OPERATIONAL METADATA ==========
      
      await queryInterface.addColumn('audit_logs', 'duration_ms', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Execution time in milliseconds',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'response_code', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'HTTP or system response code',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'node_id', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Server instance identifier',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'trace_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Distributed tracing ID',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'span_id', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Span ID for distributed tracing',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'timestamp', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('NOW'),
        comment: 'Event timestamp (UTC)',
      }, { transaction });

      await queryInterface.addColumn('audit_logs', 'inserted_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('NOW'),
        comment: 'Actual database write time',
      }, { transaction });

      // Backfill existing records
     await queryInterface.sequelize.query(`
    UPDATE audit_logs 
    SET 
      uuid = COALESCE(uuid, gen_random_uuid()),
      timestamp = COALESCE(timestamp, created_at),
      inserted_at = COALESCE(inserted_at, created_at),
      status = CASE 
        WHEN details->>'status' = 'FAILED' OR details->>'status' = 'FAILURE' THEN 'FAILURE'::enum_audit_logs_status
        WHEN details->>'status' = 'ERROR' THEN 'ERROR'::enum_audit_logs_status
        ELSE 'SUCCESS'::enum_audit_logs_status
      END,
      source_ip = COALESCE(details->>'ipAddress', details->>'sourceIP'),
      user_agent = details->>'userAgent',
      metadata = COALESCE(metadata, details, '{}'::jsonb),
      environment = CASE 
        WHEN '${process.env.NODE_ENV}' = 'production' THEN 'PRODUCTION'::enum_audit_logs_environment
        WHEN '${process.env.NODE_ENV}' = 'staging' THEN 'STAGING'::enum_audit_logs_environment
        ELSE 'DEVELOPMENT'::enum_audit_logs_environment
      END,
      service_name = 'auth-service',
      actor_type = 'USER'::enum_audit_logs_actor_type,
      data_classification = 'INTERNAL'::enum_audit_logs_data_classification
    WHERE uuid IS NULL OR timestamp IS NULL
  `, { transaction });

      // Make required fields NOT NULL after backfilling
      await queryInterface.changeColumn('audit_logs', 'uuid', {
        type: Sequelize.UUID,
        allowNull: false,
      }, { transaction });

      await queryInterface.changeColumn('audit_logs', 'timestamp', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      }, { transaction });

      await queryInterface.changeColumn('audit_logs', 'inserted_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      }, { transaction });

      await queryInterface.changeColumn('audit_logs', 'status', {
        type: Sequelize.ENUM('SUCCESS', 'FAILURE', 'PENDING', 'ERROR'),
        allowNull: false,
        defaultValue: 'SUCCESS',
      }, { transaction });

      // ========== INDEXES ==========
      
      await queryInterface.addIndex('audit_logs', ['uuid'], { 
        unique: true,
        name: 'audit_logs_uuid_unique',
        transaction 
      });
      
      await queryInterface.addIndex('audit_logs', ['timestamp'], { transaction });
      await queryInterface.addIndex('audit_logs', ['request_id'], { transaction });
      await queryInterface.addIndex('audit_logs', ['correlation_id'], { transaction });
      await queryInterface.addIndex('audit_logs', ['session_id'], { transaction });
      await queryInterface.addIndex('audit_logs', ['user_id', 'timestamp'], { transaction });
      await queryInterface.addIndex('audit_logs', ['org_id', 'timestamp'], { transaction });
      await queryInterface.addIndex('audit_logs', ['action', 'timestamp'], { transaction });
      await queryInterface.addIndex('audit_logs', ['category', 'severity'], { transaction });
      await queryInterface.addIndex('audit_logs', ['status'], { transaction });
      await queryInterface.addIndex('audit_logs', ['risk_score'], { transaction });
      await queryInterface.addIndex('audit_logs', ['affected_entity_type', 'affected_entity_id'], { transaction });
      await queryInterface.addIndex('audit_logs', ['trace_id'], { transaction });
      await queryInterface.addIndex('audit_logs', ['immutable_hash'], { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove indexes
      await queryInterface.removeIndex('audit_logs', 'audit_logs_uuid_unique', { transaction });
      await queryInterface.removeIndex('audit_logs', ['timestamp'], { transaction });
      await queryInterface.removeIndex('audit_logs', ['request_id'], { transaction });
      await queryInterface.removeIndex('audit_logs', ['correlation_id'], { transaction });
      await queryInterface.removeIndex('audit_logs', ['session_id'], { transaction });
      await queryInterface.removeIndex('audit_logs', ['user_id', 'timestamp'], { transaction });
      await queryInterface.removeIndex('audit_logs', ['org_id', 'timestamp'], { transaction });
      await queryInterface.removeIndex('audit_logs', ['action', 'timestamp'], { transaction });
      await queryInterface.removeIndex('audit_logs', ['category', 'severity'], { transaction });
      await queryInterface.removeIndex('audit_logs', ['status'], { transaction });
      await queryInterface.removeIndex('audit_logs', ['risk_score'], { transaction });
      await queryInterface.removeIndex('audit_logs', ['affected_entity_type', 'affected_entity_id'], { transaction });
      await queryInterface.removeIndex('audit_logs', ['trace_id'], { transaction });
      await queryInterface.removeIndex('audit_logs', ['immutable_hash'], { transaction });

      // Remove columns
      const columnsToRemove = [
        'uuid', 'session_id', 'request_id', 'correlation_id',
        'category', 'severity', 'status', 'message', 'metadata',
        'source_ip', 'destination_ip', 'user_agent', 'geo_location',
        'device_id', 'os', 'browser', 'environment', 'service_name',
        'risk_score', 'compliance_tags', 'immutable_hash',
        'actor_type', 'affected_entity_type', 'affected_entity_id',
        'auth_method', 'privilege_level', 'data_classification',
        'duration_ms', 'response_code', 'node_id', 'trace_id', 'span_id',
        'timestamp', 'inserted_at'
      ];

      for (const column of columnsToRemove) {
        await queryInterface.removeColumn('audit_logs', column, { transaction });
      }

      // Drop ENUM types
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_category";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_severity";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_status";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_actor_type";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_auth_method";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_privilege_level";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_data_classification";', { transaction });
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_audit_logs_environment";', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};

