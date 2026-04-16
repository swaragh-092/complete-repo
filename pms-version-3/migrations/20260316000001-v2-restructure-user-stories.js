"use strict";

const TABLE_PREFIX = "pms_";

module.exports = {
  async up(queryInterface, Sequelize) {
    // =====================================================
    // 1. Create User Stories table
    // =====================================================
    const userStoriesTable = `${TABLE_PREFIX}user_stories`;

    await queryInterface.createTable(userStoriesTable, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: `${TABLE_PREFIX}projects`, key: "id" },
        onDelete: "CASCADE",
      },

      feature_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: `${TABLE_PREFIX}features`, key: "id" },
        onDelete: "CASCADE",
      },

      parent_user_story_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: userStoriesTable, key: "id" },
        onDelete: "CASCADE",
        comment:
          "Self-referencing FK for sub user stories. NULL means top-level.",
      },

      department_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      acceptance_criteria: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      priority: {
        type: Sequelize.ENUM("low", "medium", "high", "critical"),
        defaultValue: "medium",
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM("defined", "in_progress", "completed", "blocked"),
        defaultValue: "defined",
        allowNull: false,
      },

      story_points: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      organization_id: Sequelize.UUID,
      created_by: Sequelize.UUID,
      updated_by: Sequelize.UUID,
      created_ip: Sequelize.STRING(45),
      updated_ip: Sequelize.STRING(45),
      created_user_agent: Sequelize.STRING(255),
      updated_user_agent: Sequelize.STRING(255),

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        allowNull: false,
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        allowNull: false,
      },

      deleted_at: Sequelize.DATE,
    });

    // Indexes for user_stories
    await queryInterface.addIndex(userStoriesTable, ["project_id"], {
      name: `${userStoriesTable}_project_index`,
    });
    await queryInterface.addIndex(userStoriesTable, ["feature_id"], {
      name: `${userStoriesTable}_feature_index`,
    });
    await queryInterface.addIndex(userStoriesTable, ["parent_user_story_id"], {
      name: `${userStoriesTable}_parent_index`,
    });
    await queryInterface.addIndex(userStoriesTable, ["department_id"], {
      name: `${userStoriesTable}_department_index`,
    });
    await queryInterface.addIndex(userStoriesTable, ["organization_id"], {
      name: `${userStoriesTable}_org_index`,
    });
    await queryInterface.addIndex(userStoriesTable, ["status"], {
      name: `${userStoriesTable}_status_index`,
    });

    // =====================================================
    // 2. Add project_id column to features table
    //    Features become project-scoped independent entities
    // =====================================================
    await queryInterface.addColumn(`${TABLE_PREFIX}features`, "project_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: `${TABLE_PREFIX}projects`, key: "id" },
      onDelete: "CASCADE",
    });

    await queryInterface.addIndex(`${TABLE_PREFIX}features`, ["project_id"], {
      name: `${TABLE_PREFIX}features_project_index`,
    });

    // =====================================================
    // 3. Add user_story_id to tasks table
    //    Tasks now map directly to user stories
    // =====================================================
    await queryInterface.addColumn(`${TABLE_PREFIX}tasks`, "user_story_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: userStoriesTable, key: "id" },
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex(`${TABLE_PREFIX}tasks`, ["user_story_id"], {
      name: `${TABLE_PREFIX}tasks_user_story_index`,
    });

    // =====================================================
    // 4. Add user_story_id to issues table
    //    Issues are now linked to user stories
    // =====================================================
    await queryInterface.addColumn(`${TABLE_PREFIX}issues`, "user_story_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: userStoriesTable, key: "id" },
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex(`${TABLE_PREFIX}issues`, ["user_story_id"], {
      name: `${TABLE_PREFIX}issues_user_story_index`,
    });

    // =====================================================
    // 5. Drop daily logs table
    // =====================================================
    await queryInterface.dropTable(`${TABLE_PREFIX}daily_logs`);
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}daily_logs_status";`,
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}daily_logs_log_type";`,
    );
  },

  async down(queryInterface, Sequelize) {
    // Reverse: Remove user_story_id from issues
    await queryInterface.removeColumn(`${TABLE_PREFIX}issues`, "user_story_id");

    // Reverse: Remove user_story_id from tasks
    await queryInterface.removeColumn(`${TABLE_PREFIX}tasks`, "user_story_id");

    // Reverse: Remove project_id from features
    await queryInterface.removeColumn(`${TABLE_PREFIX}features`, "project_id");

    // Reverse: Drop user_stories table
    await queryInterface.dropTable(`${TABLE_PREFIX}user_stories`);
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}user_stories_priority";`,
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}user_stories_status";`,
    );

    // Reverse: Recreate daily_logs table
    await queryInterface.createTable(`${TABLE_PREFIX}daily_logs`, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: { type: Sequelize.UUID, allowNull: false },
      project_id: { type: Sequelize.UUID, allowNull: false },
      task_id: { type: Sequelize.UUID, allowNull: true },
      department_id: { type: Sequelize.UUID, allowNull: false },
      log_type: {
        type: Sequelize.ENUM("standup", "wrapup"),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "completed"),
        defaultValue: "pending",
        allowNull: false,
      },
      expected_duration: { type: Sequelize.INTEGER, allowNull: true },
      actual_duration: { type: Sequelize.INTEGER, allowNull: true },
      related_id: { type: Sequelize.UUID, allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      log_date: { type: Sequelize.DATEONLY, allowNull: false },
      organization_id: Sequelize.UUID,
      created_by: Sequelize.UUID,
      updated_by: Sequelize.UUID,
      created_ip: Sequelize.STRING(45),
      updated_ip: Sequelize.STRING(45),
      created_user_agent: Sequelize.STRING(255),
      updated_user_agent: Sequelize.STRING(255),
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        allowNull: false,
      },
      deleted_at: Sequelize.DATE,
    });
  },
};
