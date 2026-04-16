'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create Workspaces Table
    await queryInterface.createTable('workspaces', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      org_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true, // Nullable to handle system-created workspaces or deleted users
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Indexes for Workspaces
    await queryInterface.addIndex('workspaces', ['org_id']);
    await queryInterface.addIndex('workspaces', ['org_id', 'slug'], { unique: true });
    await queryInterface.addIndex('workspaces', ['deleted_at']);

    // 2. Create Workspace Memberships Table
    await queryInterface.createTable('workspace_memberships', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      workspace_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'workspaces',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      role: { // Using simple string role for workspace context (viewer, editor, admin)
        type: Sequelize.ENUM('viewer', 'editor', 'admin'),
        allowNull: false,
        defaultValue: 'viewer'
      },
      status: {
        type: Sequelize.ENUM('active', 'invited', 'suspended'),
        allowNull: false,
        defaultValue: 'active'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Indexes for Workspace Memberships
    await queryInterface.addIndex('workspace_memberships', ['workspace_id']);
    await queryInterface.addIndex('workspace_memberships', ['user_id']);
    await queryInterface.addIndex('workspace_memberships', ['workspace_id', 'user_id'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('workspace_memberships');
    await queryInterface.dropTable('workspaces');
  }
};
