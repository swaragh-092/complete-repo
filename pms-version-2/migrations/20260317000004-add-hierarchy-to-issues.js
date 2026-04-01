"use strict";

const TABLE_PREFIX = "pms_";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Add parent_id to pms_issues
      await queryInterface.addColumn(
        `${TABLE_PREFIX}issues`,
        "parent_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: `${TABLE_PREFIX}issues`,
            key: "id",
          },
          onDelete: "SET NULL", // Use SET NULL to avoid cascading deletes obliterating trees unless intended
        },
        { transaction },
      );

      // 2. Add hierarchy_level to pms_issue_types
      // Using generic ENUM/String for flexibility
      await queryInterface.addColumn(
        `${TABLE_PREFIX}issue_types`,
        "hierarchy_level",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 3, // Default to lowest level (Subtask/Task)
          comment: "1=Epic, 2=Story, 3=Task/Subtask",
        },
        { transaction },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn(`${TABLE_PREFIX}issues`, "parent_id", {
        transaction,
      });
      await queryInterface.removeColumn(
        `${TABLE_PREFIX}issue_types`,
        "hierarchy_level",
        { transaction },
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
