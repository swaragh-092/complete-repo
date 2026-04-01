"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add sprint_id to user_stories so User Stories can be assigned to a Sprint
    await queryInterface.addColumn("pms_user_stories", "sprint_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "pms_sprints",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Float ordering column for backlog drag-and-drop (same pattern as Issues)
    await queryInterface.addColumn("pms_user_stories", "backlog_order", {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 65535.0,
    });

    await queryInterface.addIndex("pms_user_stories", ["sprint_id"], {
      name: "idx_user_stories_sprint_id",
    });

    await queryInterface.addIndex(
      "pms_user_stories",
      ["sprint_id", "backlog_order"],
      {
        name: "idx_user_stories_sprint_backlog_order",
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "pms_user_stories",
      "idx_user_stories_sprint_backlog_order",
    );
    await queryInterface.removeIndex(
      "pms_user_stories",
      "idx_user_stories_sprint_id",
    );
    await queryInterface.removeColumn("pms_user_stories", "backlog_order");
    await queryInterface.removeColumn("pms_user_stories", "sprint_id");
  },
};
