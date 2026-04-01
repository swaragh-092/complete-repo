"use strict";

const TABLE_PREFIX = "pms_";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Drop deprecated tables
      // We use CASCADE to drop dependent constraints
      await queryInterface
        .dropTable(`${TABLE_PREFIX}checklist_tasks`, {
          transaction,
          cascade: true,
          logging: false,
        })
        .catch(() => {});
      await queryInterface
        .dropTable(`${TABLE_PREFIX}checklist_items`, {
          transaction,
          cascade: true,
          logging: false,
        })
        .catch(() => {});
      await queryInterface
        .dropTable(`${TABLE_PREFIX}checklists`, {
          transaction,
          cascade: true,
          logging: false,
        })
        .catch(() => {});
      // Also drop tasks table as we are merging it into user_stories
      await queryInterface
        .dropTable(`${TABLE_PREFIX}task_dependencies`, {
          transaction,
          cascade: true,
          logging: false,
        })
        .catch(() => {});
      await queryInterface
        .dropTable(`${TABLE_PREFIX}tasks`, {
          transaction,
          cascade: true,
          logging: false,
        })
        .catch(() => {});

      // Also make sure daily logs are gone
      await queryInterface
        .dropTable(`${TABLE_PREFIX}daily_logs`, {
          transaction,
          cascade: true,
          logging: false,
        })
        .catch(() => {});

      // 2. Add columns to user_stories table to support task functionality
      const userStoriesTable = `${TABLE_PREFIX}user_stories`;

      await queryInterface.addColumn(
        userStoriesTable,
        "assigned_to",
        {
          type: Sequelize.UUID,
          allowNull: true,
          comment: "User assigned to work on this story",
        },
        { transaction },
      );

      await queryInterface.addColumn(
        userStoriesTable,
        "assignee",
        {
          type: Sequelize.UUID,
          allowNull: true,
          comment: "User who assigned the story (e.g. PM)",
        },
        { transaction },
      );

      await queryInterface.addColumn(
        userStoriesTable,
        "total_work_time",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: "Total time spent in minutes",
        },
        { transaction },
      );

      await queryInterface.addColumn(
        userStoriesTable,
        "live_status",
        {
          type: Sequelize.ENUM("running", "stop"),
          defaultValue: "stop",
          comment: "Timer status",
        },
        { transaction },
      );

      await queryInterface.addColumn(
        userStoriesTable,
        "taken_at",
        {
          type: Sequelize.DATE,
          allowNull: true,
          comment: "When work started",
        },
        { transaction },
      );

      // 3. Update Issue table to link to User Story
      // This was already done in the previous migration (20260316000001)
      // keeping here for reference but commented out to avoid "column already exists" error
      /*
      const issuesTable = `${TABLE_PREFIX}issues`;
      await queryInterface.addColumn(
        issuesTable,
        "user_story_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: userStoriesTable,
            key: "id",
          },
          onDelete: "SET NULL",
        },
        { transaction },
      );
      */

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // We cannot easily recreate dropped tables with data, but we can remove added columns
    const transaction = await queryInterface.sequelize.transaction();
    const userStoriesTable = `${TABLE_PREFIX}user_stories`;
    const issuesTable = `${TABLE_PREFIX}issues`;

    try {
      await queryInterface.removeColumn(issuesTable, "user_story_id", {
        transaction,
      });
      await queryInterface.removeColumn(userStoriesTable, "assigned_to", {
        transaction,
      });
      await queryInterface.removeColumn(userStoriesTable, "assignee", {
        transaction,
      });
      await queryInterface.removeColumn(userStoriesTable, "total_work_time", {
        transaction,
      });
      await queryInterface.removeColumn(userStoriesTable, "live_status", {
        transaction,
      });
      await queryInterface.removeColumn(userStoriesTable, "taken_at", {
        transaction,
      });

      // Note: Re-creating tables is complex and omitted for brevity in rollback
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
