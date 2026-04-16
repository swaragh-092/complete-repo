'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('trusted_devices', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user_metadata',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      device_fingerprint: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      device_name: {
        type: Sequelize.STRING(100),
        defaultValue: 'Unknown Device'
      },
      device_type: {
        type: Sequelize.ENUM('mobile', 'desktop', 'tablet', 'unknown'),
        defaultValue: 'unknown'
      },
      browser: {
        type: Sequelize.STRING(50)
      },
      os: {
        type: Sequelize.STRING(50)
      },
      os_version: {
        type: Sequelize.STRING(50)
      },
      ip_address: {
        type: Sequelize.STRING(45)
      },
      location: {
        type: Sequelize.STRING(100)
      },
      trust_status: {
        type: Sequelize.ENUM('pending', 'trusted', 'revoked', 'expired'),
        defaultValue: 'pending'
      },
      trusted_at: {
        type: Sequelize.DATE
      },
      expires_at: {
        type: Sequelize.DATE
      },
      last_used: {
        type: Sequelize.DATE
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      }
    });

    // Add indexes
    await queryInterface.addIndex('trusted_devices', ['user_id'], {
      name: 'idx_trusted_devices_user_id'
    });

    await queryInterface.addIndex('trusted_devices', ['device_fingerprint'], {
      name: 'idx_trusted_devices_fingerprint'
    });

    await queryInterface.addIndex('trusted_devices', ['trust_status'], {
      name: 'idx_trusted_devices_status'
    });

    await queryInterface.addIndex('trusted_devices', ['user_id', 'device_fingerprint'], {
      name: 'idx_trusted_devices_user_fingerprint',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('trusted_devices');
  }
};
