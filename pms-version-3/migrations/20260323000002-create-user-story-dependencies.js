// Migration: Create pms_user_story_dependencies table
// This join table stores "User Story A depends on User Story B" relationships.
// A = parent_story_id (the story that has the dependency / is blocked)
// B = dependency_story_id (the story that must be done first / the blocker)

"use strict";

const TABLE_PREFIX = (process.env.DB_PREFIX || "pms") + "_";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(TABLE_PREFIX + "user_story_dependencies", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      parent_story_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: TABLE_PREFIX + "user_stories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      dependency_story_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: TABLE_PREFIX + "user_stories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    // Prevent duplicate dependency pairs
    await queryInterface.addIndex(
      TABLE_PREFIX + "user_story_dependencies",
      ["parent_story_id", "dependency_story_id"],
      { unique: true, name: "uq_user_story_dependency_pair" },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable(TABLE_PREFIX + "user_story_dependencies");
  },
};
