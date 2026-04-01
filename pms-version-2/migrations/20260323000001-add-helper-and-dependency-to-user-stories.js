"use strict";

const TABLE_PREFIX = (process.env.DB_PREFIX || "pms") + "_";
const USER_STORIES = TABLE_PREFIX + "user_stories";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add story_for ENUM to user_stories
    await queryInterface.addColumn(USER_STORIES, "story_for", {
      type: Sequelize.ENUM("normal", "help"),
      defaultValue: "normal",
      allowNull: false,
      after: "type",
    });

    // 2. Add helped_for FK to user_stories (self-referencing for helper stories)
    await queryInterface.addColumn(USER_STORIES, "helped_for", {
      type: Sequelize.UUID,
      allowNull: true,
      after: "story_for",
      references: {
        model: USER_STORIES,
        key: "id",
      },
      onDelete: "SET NULL",
    });

    // 3. Extend the status ENUM to include helper story workflow values
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_${USER_STORIES}_status" ADD VALUE IF NOT EXISTS 'accept_pending';`,
    );
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_${USER_STORIES}_status" ADD VALUE IF NOT EXISTS 'reject';`,
    );
  },

  async down(queryInterface) {
    // Note: PostgreSQL does not support removing ENUM values. The accept_pending/reject values
    // can only be cleaned up by recreating the type, which requires a table rebuild.
    await queryInterface.removeColumn(USER_STORIES, "helped_for");
    await queryInterface.removeColumn(USER_STORIES, "story_for");
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${USER_STORIES}_story_for";`,
    );
  },
};
