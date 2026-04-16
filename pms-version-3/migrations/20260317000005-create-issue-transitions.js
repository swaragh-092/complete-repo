"use strict";

const TABLE_PREFIX = "pms_";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Create Issue Transitions Table
      await queryInterface.createTable(
        `${TABLE_PREFIX}issue_transitions`,
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          project_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: `${TABLE_PREFIX}projects`,
              key: "id",
            },
            onDelete: "CASCADE",
          },
          from_status_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: `${TABLE_PREFIX}issue_statuses`,
              key: "id",
            },
            onDelete: "CASCADE",
          },
          to_status_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: `${TABLE_PREFIX}issue_statuses`,
              key: "id",
            },
            onDelete: "CASCADE",
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        { transaction },
      );

      // Add unique constraint to prevent duplicate transitions
      await queryInterface.addConstraint(`${TABLE_PREFIX}issue_transitions`, {
        fields: ["project_id", "from_status_id", "to_status_id"],
        type: "unique",
        name: "unique_transition",
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable(`${TABLE_PREFIX}issue_transitions`, {
        transaction,
      });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
