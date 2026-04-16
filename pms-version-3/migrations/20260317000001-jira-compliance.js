"use strict";

const TABLE_PREFIX = "pms_";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Add 'type' to user_stories to distinguish between Story and Task
      await queryInterface.addColumn(
        `${TABLE_PREFIX}user_stories`,
        "type",
        {
          type: Sequelize.ENUM("story", "task"),
          defaultValue: "story",
          allowNull: false,
          comment:
            "Distinguishes between a functional User Story and a technical Task",
        },
        { transaction },
      );

      // 2. Add 'reporter_id' to user_stories (Jira standard field)
      await queryInterface.addColumn(
        `${TABLE_PREFIX}user_stories`,
        "reporter_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          comment: "User who reported/created the item",
        },
        { transaction },
      );

      // 3. Add 'parent_feature_id' to features (Sub-features)
      await queryInterface.addColumn(
        `${TABLE_PREFIX}features`,
        "parent_feature_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: `${TABLE_PREFIX}features`,
            key: "id",
          },
          onDelete: "CASCADE",
          comment: "Hierarchy for Sub-Features",
        },
        { transaction },
      );

      // 4. Add 'approval_status' and 'approved_by' for strict approval workflow
      await queryInterface.addColumn(
        `${TABLE_PREFIX}user_stories`,
        "approval_status",
        {
          type: Sequelize.ENUM(
            "pending",
            "approved",
            "rejected",
            "not_required",
          ),
          defaultValue: "not_required",
        },
        { transaction },
      );

      await queryInterface.addColumn(
        `${TABLE_PREFIX}user_stories`,
        "approved_by",
        {
          type: Sequelize.UUID,
          allowNull: true,
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn(`${TABLE_PREFIX}user_stories`, "type", {
        transaction,
      });
      await queryInterface.removeColumn(
        `${TABLE_PREFIX}user_stories`,
        "reporter_id",
        { transaction },
      );
      await queryInterface.removeColumn(
        `${TABLE_PREFIX}features`,
        "parent_feature_id",
        { transaction },
      );
      await queryInterface.removeColumn(
        `${TABLE_PREFIX}user_stories`,
        "approval_status",
        { transaction },
      );
      await queryInterface.removeColumn(
        `${TABLE_PREFIX}user_stories`,
        "approved_by",
        { transaction },
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
