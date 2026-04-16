"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const TABLE_PREFIX = (process.env.DB_PREFIX || "pms") + "_";

    await queryInterface.createTable(TABLE_PREFIX + "story_change_requests", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      story_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: TABLE_PREFIX + "user_stories",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      requested_by: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "User ID of the person requesting the change",
      },
      request_type: {
        type: Sequelize.ENUM("due_date_change", "status_revert"),
        allowNull: false,
      },
      requested_value: {
        type: Sequelize.JSON,
        allowNull: false,
        comment:
          "e.g. { due_date: '2026-05-01' } or { target_status: 'defined' }",
      },
      current_value: {
        type: Sequelize.JSON,
        allowNull: true,
        comment:
          "e.g. { due_date: '2026-04-01' } or { current_status: 'in_progress' }",
      },
      status: {
        type: Sequelize.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
        allowNull: false,
      },
      reviewed_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      review_comments: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex(
      TABLE_PREFIX + "story_change_requests",
      ["story_id", "status"],
      { name: TABLE_PREFIX + "story_change_requests_story_status_idx" },
    );
  },

  async down(queryInterface) {
    const TABLE_PREFIX = (process.env.DB_PREFIX || "pms") + "_";
    await queryInterface.dropTable(TABLE_PREFIX + "story_change_requests");
  },
};
