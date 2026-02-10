'use strict';

const TABLE_PREFIX = process.env.DB_PREFIX + "_";
const tableName = `${TABLE_PREFIX}daily_logs`;

module.exports = {
  async up(queryInterface, Sequelize) {


    await queryInterface.createTable(tableName, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: TABLE_PREFIX + "projects",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: TABLE_PREFIX + "tasks",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },

      log_type: {
        type: Sequelize.ENUM("standup", "wrapup"),
        allowNull: false,
      },

      expected_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      actual_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM(
          "completed",
          "in_progress",
          "blocked",
          "not_taken"
        ),
        allowNull: true,
      },

      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      related_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: tableName,
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },

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

    // 🔥 Prevent duplicate standup/wrapup per user-task-date
    await queryInterface.addConstraint(
      tableName,
      {
        fields: ["user_id", "task_id", "date", "log_type"],
        type: "unique",
        name: tableName + "_unique_per_day",
      }
    );

    // 🔥 Performance indexes
    await queryInterface.addIndex(
      tableName,
      ["user_id", "date"],
      { name: tableName + "_user_date_idx" }
    );

    await queryInterface.addIndex(
      tableName,
      ["task_id"],
      { name: tableName + "_task_idx" }
    );
  },

  async down(queryInterface) {
    

    await queryInterface.dropTable(tableName);

    // Important for Postgres ENUM cleanup
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${tableName}_log_type";`
    );

    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${tableName}_status";`
    );
  },
};
