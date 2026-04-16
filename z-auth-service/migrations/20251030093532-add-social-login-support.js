'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create federated_identity_mapping table
    await queryInterface.createTable('federated_identity_mapping', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user_metadata',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      provider: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      provider_user_id: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      provider_email: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      linked_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('federated_identity_mapping', ['provider', 'provider_user_id'], {
      unique: true,
      name: 'federated_identity_unique'
    });
    await queryInterface.addIndex('federated_identity_mapping', ['user_id']);
    await queryInterface.addIndex('federated_identity_mapping', ['provider']);

    // Add columns to user_metadata
    await queryInterface.addColumn('user_metadata', 'last_login_provider', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    await queryInterface.addColumn('user_metadata', 'last_login_ip', {
      type: Sequelize.STRING(45),
      allowNull: true
    });

    // Add columns to organizations
    await queryInterface.addColumn('organizations', 'allowed_providers', {
      type: Sequelize.JSON,
      defaultValue: ['google', 'microsoft', 'github', 'keycloak']
    });
    await queryInterface.addColumn('organizations', 'email_domain_restriction', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
    await queryInterface.addColumn('organizations', 'enforce_provider_domain', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('federated_identity_mapping');
    await queryInterface.removeColumn('user_metadata', 'last_login_provider');
    await queryInterface.removeColumn('user_metadata', 'last_login_ip');
    await queryInterface.removeColumn('organizations', 'allowed_providers');
    await queryInterface.removeColumn('organizations', 'email_domain_restriction');
    await queryInterface.removeColumn('organizations', 'enforce_provider_domain');
  }
};
