// Description: Work Logs table — captures per-session work entries
//              Created when a user starts a timer on a UserStory, closed on stop.
// Version: 1.0.0

"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const TABLE_PREFIX = (process.env.DB_PREFIX || "pms") + "_";
    const tableName = TABLE_PREFIX + "work_logs";

    await queryInterface.createTable(tableName, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "FK → User (from Auth module)",
      },
      user_story_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "FK → pms_user_stories",
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "FK → pms_projects",
      },
      feature_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "FK → pms_features",
      },
      department_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "Department the work belongs to",
      },
      sprint_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "FK → pms_sprints (nullable)",
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: "When the timer was started",
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "When the timer was stopped (null = still running)",
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "Computed on stop: round((end_time - start_time) / 60000)",
      },
      log_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: "Calendar date of start_time (for daily grouping)",
      },
      // common fields
      organization_id: { type: Sequelize.UUID, allowNull: true },
      created_by: { type: Sequelize.UUID, allowNull: true },
      updated_by: { type: Sequelize.UUID, allowNull: true },
      created_ip: { type: Sequelize.STRING(45), allowNull: true },
      updated_ip: { type: Sequelize.STRING(45), allowNull: true },
      created_user_agent: { type: Sequelize.STRING(255), allowNull: true },
      updated_user_agent: { type: Sequelize.STRING(255), allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    await queryInterface.addIndex(tableName, ["user_id", "log_date"], {
      name: TABLE_PREFIX + "work_logs_user_date_idx",
    });
    await queryInterface.addIndex(tableName, ["project_id", "user_id"], {
      name: TABLE_PREFIX + "work_logs_project_user_idx",
    });
    await queryInterface.addIndex(tableName, ["department_id", "user_id"], {
      name: TABLE_PREFIX + "work_logs_dept_user_idx",
    });
    await queryInterface.addIndex(tableName, ["user_story_id"], {
      name: TABLE_PREFIX + "work_logs_story_idx",
    });
  },

  down: async (queryInterface) => {
    const TABLE_PREFIX = (process.env.DB_PREFIX || "pms") + "_";
    await queryInterface.dropTable(TABLE_PREFIX + "work_logs");
  },
};
