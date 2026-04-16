'use strict';

/**
 * Create core tables: clients, audit_logs, tenant_mappings
 * Made idempotent - checks if tables exist before creating
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();

    // Create clients table
    if (!tables.includes('clients')) {
      await queryInterface.createTable('clients', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        client_key: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
        },
        client_id: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
        client_secret: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        callback_url: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        requires_tenant: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        tenant_id: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
        realm_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'realms',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        redirect_url: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        request_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'client_requests',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        auto_generated: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
      });
      await queryInterface.addIndex('clients', ['client_key', 'realm_id', 'tenant_id']);
    } else {
      console.log('✅ clients already exists, skipping...');
    }

    // Create audit_logs table
    if (!tables.includes('audit_logs')) {
      await queryInterface.createTable('audit_logs', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        org_id: {
          type: Sequelize.STRING(50),
        },
        user_id: {
          type: Sequelize.STRING(50),
        },
        client_id: {
          type: Sequelize.STRING(100),
        },
        action: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        details: {
          type: Sequelize.JSONB,
          defaultValue: {},
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      });
      await queryInterface.addIndex('audit_logs', ['org_id', 'user_id', 'client_id', 'action']);
    } else {
      console.log('✅ audit_logs already exists, skipping...');
    }

    // Create tenant_mappings table
    if (!tables.includes('tenant_mappings')) {
      await queryInterface.createTable('tenant_mappings', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        tenant_id: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        client_key: {
          type: Sequelize.STRING(50),
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
        },
      });

      await queryInterface.addConstraint('tenant_mappings', {
        fields: ['user_id', 'tenant_id', 'client_key'],
        type: 'unique',
        name: 'tenant_mappings_unique',
      });

      await queryInterface.addConstraint('tenant_mappings', {
        fields: ['client_key'],
        type: 'foreign key',
        name: 'fk_tenant_mappings_client_key',
        references: {
          table: 'clients',
          field: 'client_key',
        },
        onDelete: 'CASCADE',
      });
    } else {
      console.log('✅ tenant_mappings already exists, skipping...');
    }
  },

  down: async (queryInterface) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('tenant_mappings')) {
      await queryInterface.dropTable('tenant_mappings');
    }
    if (tables.includes('audit_logs')) {
      await queryInterface.dropTable('audit_logs');
    }
    if (tables.includes('clients')) {
      await queryInterface.dropTable('clients');
    }
  },
};