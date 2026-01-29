// Migration: Create Authorization Tables (ABAC + ReBAC)

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create policies table (ABAC)
    await queryInterface.createTable('policies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      org_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      client_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        references: {
          model: 'clients',
          key: 'client_id',
        },
        onDelete: 'CASCADE',
      },
      effect: {
        type: Sequelize.ENUM('allow', 'deny'),
        allowNull: false,
        defaultValue: 'allow',
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      conditions: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      resources: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      actions: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      subjects: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      environment: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    // Create relationships table (ReBAC)
    await queryInterface.createTable('relationships', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      source_type: {
        type: Sequelize.ENUM('user', 'organization', 'resource', 'role', 'group'),
        allowNull: false,
      },
      source_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      relation_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      target_type: {
        type: Sequelize.ENUM('user', 'organization', 'resource', 'role', 'group'),
        allowNull: false,
      },
      target_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      org_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    // Create resource_attributes table (ABAC)
    await queryInterface.createTable('resource_attributes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      resource_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      resource_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      org_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organizations',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      attributes: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      classification: {
        type: Sequelize.ENUM('public', 'internal', 'confidential', 'restricted'),
        defaultValue: 'internal',
      },
      tags: {
        type: Sequelize.JSONB,
        defaultValue: [],
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

    // Add indexes
    await queryInterface.addIndex('policies', ['org_id']);
    await queryInterface.addIndex('policies', ['client_id']);
    await queryInterface.addIndex('policies', ['is_active']);
    await queryInterface.addIndex('policies', ['priority']);
    await queryInterface.addIndex('policies', ['effect']);

    await queryInterface.addIndex('relationships', ['source_type', 'source_id']);
    await queryInterface.addIndex('relationships', ['target_type', 'target_id']);
    await queryInterface.addIndex('relationships', ['relation_type']);
    await queryInterface.addIndex('relationships', ['org_id']);
    await queryInterface.addIndex('relationships', ['is_active']);
    await queryInterface.addIndex('relationships', ['source_type', 'source_id', 'relation_type', 'target_type', 'target_id'], {
      name: 'relationship_unique_idx',
      unique: false,
    });

    await queryInterface.addIndex('resource_attributes', ['resource_type', 'resource_id'], {
      unique: true,
      name: 'resource_attribute_unique_idx',
    });
    await queryInterface.addIndex('resource_attributes', ['org_id']);
    await queryInterface.addIndex('resource_attributes', ['classification']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('resource_attributes');
    await queryInterface.dropTable('relationships');
    await queryInterface.dropTable('policies');
  },
};








