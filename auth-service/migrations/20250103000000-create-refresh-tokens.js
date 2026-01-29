'use strict';

/**
 * Migration to create refresh_tokens table for secure token storage
 * Enterprise-grade refresh token management with rotation support
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('refresh_tokens', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      user_id: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Keycloak user ID (sub claim)',
      },
      client_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Keycloak client ID',
      },
      token_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'SHA-256 hash of the refresh token (never store plain token)',
      },
      realm_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Keycloak realm name',
      },
      session_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Keycloak session ID',
      },
      device_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Device fingerprint for device tracking',
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'IP address when token was issued',
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User agent when token was issued',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Token expiration timestamp',
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When token was revoked (null = active)',
      },
      revoked_reason: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Reason for revocation (logout, refresh, security)',
      },
      rotated_from: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'refresh_tokens',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Previous token ID if this was rotated',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: 'Additional metadata (provider, org_id, etc.)',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Indexes for performance
    await queryInterface.addIndex('refresh_tokens', ['user_id']);
    await queryInterface.addIndex('refresh_tokens', ['client_id']);
    await queryInterface.addIndex('refresh_tokens', ['token_hash'], { unique: true });
    await queryInterface.addIndex('refresh_tokens', ['realm_name']);
    await queryInterface.addIndex('refresh_tokens', ['expires_at']);
    await queryInterface.addIndex('refresh_tokens', ['revoked_at']);
    await queryInterface.addIndex('refresh_tokens', ['user_id', 'client_id', 'revoked_at']);
    await queryInterface.addIndex('refresh_tokens', ['device_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('refresh_tokens');
  },
};







