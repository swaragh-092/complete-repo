'use strict';

const TABLE_PREFIX = process.env.DB_PREFIX + "_";

module.exports = {
  async up(queryInterface, Sequelize) {

    const tableName = `${TABLE_PREFIX}tasks`;

    await queryInterface.createTable(tableName, {

      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },

      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: `${TABLE_PREFIX}projects`,
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },

      department_id: {
        type: Sequelize.UUID,
        allowNull: false,
        
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },

      assignee: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: `${TABLE_PREFIX}project_members`,
          key: 'id'
        },
        onDelete: 'SET NULL'
      },

      assigned_to: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: `${TABLE_PREFIX}project_members`,
          key: 'id'
        },
        onDelete: 'SET NULL'
      },

      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: `${TABLE_PREFIX}project_members`,
          key: 'id'
        },
        onDelete: 'SET NULL'
      },

      helped_for: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: `${TABLE_PREFIX}tasks`,
          key: 'id'
        },
        onDelete: 'CASCADE'
      },

      project_feature_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: `${TABLE_PREFIX}project_features`,
          key: 'id'
        },
        onDelete: 'CASCADE'
      },

      checklist_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: `${TABLE_PREFIX}checklist_items`,
          key: 'id'
        },
        onDelete: 'CASCADE'
      },

      issue_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: `${TABLE_PREFIX}issues`,
          key: 'id'
        },
        onDelete: 'SET NULL'
      },

      title: {
        type: Sequelize.STRING,
        allowNull: false
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium',
        allowNull: false
      },

      status: {
        type: Sequelize.ENUM(
          'approve_pending',
          'approved',
          'in_progress',
          'completed',
          'blocked',
          'assign_pending',
          'checklist_removed',
          'accept_pending',
          'reject'
        ),
        defaultValue: 'approve_pending',
        allowNull: false
      },

      task_for: {
        type: Sequelize.ENUM('normal', 'issue', 'checklist', 'help'),
        defaultValue: 'normal',
        allowNull: false
      },

      due_date: Sequelize.DATEONLY,
      taken_at: Sequelize.DATE,
      completed_at: Sequelize.DATE,

      metadata: Sequelize.JSON,

      live_status: {
        type: Sequelize.ENUM('running', 'stop'),
        defaultValue: 'stop'
      },

      total_work_time: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },

      todays_worked_time: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },

      last_start_time: Sequelize.DATE,
      last_worked_date: Sequelize.DATEONLY,

      // Common Fields
      organization_id: Sequelize.UUID,
      created_by: Sequelize.UUID,
      updated_by: Sequelize.UUID,
      created_ip: Sequelize.STRING(45),
      updated_ip: Sequelize.STRING(45),
      created_user_agent: Sequelize.STRING(255),
      updated_user_agent: Sequelize.STRING(255),

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },

      deleted_at: Sequelize.DATE,

    });

    // ⚡ Performance Indexes
    await queryInterface.addIndex(tableName, ['project_id']);
    await queryInterface.addIndex(tableName, ['status']);
    await queryInterface.addIndex(tableName, ['priority']);
    await queryInterface.addIndex(tableName, ['assigned_to']);
    await queryInterface.addIndex(tableName, ['issue_id']);
    await queryInterface.addIndex(tableName, ['project_feature_id']);
    await queryInterface.addIndex(tableName, ['checklist_id']);

  },

  async down(queryInterface, Sequelize) {

    const tableName = `${TABLE_PREFIX}tasks`;

    await queryInterface.dropTable(tableName);

    // Drop ENUMs (Postgres)
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${tableName}_priority";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${tableName}_status";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${tableName}_task_for";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${tableName}_live_status";`
    );
  }
};
