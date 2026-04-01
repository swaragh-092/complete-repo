"use strict";

const TABLE_PREFIX = "pms_";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Create Sprints Table
      await queryInterface.createTable(
        `${TABLE_PREFIX}sprints`,
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
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          start_date: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          end_date: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          goal: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          status: {
            type: Sequelize.ENUM("planned", "active", "completed"),
            defaultValue: "planned",
            allowNull: false,
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
          },
          deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
        },
        { transaction },
      );

      // 2. Add sprint_id to Issues table
      await queryInterface.addColumn(
        `${TABLE_PREFIX}issues`,
        "sprint_id",
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: `${TABLE_PREFIX}sprints`,
            key: "id",
          },
          onDelete: "SET NULL", // Keep issues if sprint is deleted, they go back to backlog
          onUpdate: "CASCADE",
        },
        { transaction },
      );

      // Indexes
      await queryInterface.addIndex(
        `${TABLE_PREFIX}sprints`,
        ["project_id", "status"], // filtered index or composite for lookups
        { transaction },
      );

      await queryInterface.addIndex(`${TABLE_PREFIX}issues`, ["sprint_id"], {
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn(`${TABLE_PREFIX}issues`, "sprint_id", {
        transaction,
      });
      await queryInterface.dropTable(`${TABLE_PREFIX}sprints`, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
