"use strict";

const TABLE_PREFIX = "pms_";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Create Boards Table
      await queryInterface.createTable(
        `${TABLE_PREFIX}boards`,
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
            defaultValue: "Default Board",
          },
          type: {
            type: Sequelize.ENUM("kanban", "scrum"),
            defaultValue: "kanban",
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

      // 2. Create Board Columns Table
      await queryInterface.createTable(
        `${TABLE_PREFIX}board_columns`,
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          board_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: `${TABLE_PREFIX}boards`,
              key: "id",
            },
            onDelete: "CASCADE",
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          position: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          // Map to issue statuses: Stored as JSON array of UUIDs
          mapped_status_ids: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: "Array of IssueStatus IDs mapped to this column",
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

      // 3. Add `board_order` to Issues table for drag-and-drop
      await queryInterface.addColumn(
        `${TABLE_PREFIX}issues`,
        "board_order",
        {
          type: Sequelize.FLOAT,
          allowNull: false,
          defaultValue: 65535.0, // Arbitrary starting point
        },
        { transaction },
      );

      // Add indexes
      await queryInterface.addIndex(`${TABLE_PREFIX}boards`, ["project_id"], {
        unique: false, // "Board per project" requirement implies 1, but maybe we allow multiple later.
        transaction,
      });

      await queryInterface.addIndex(
        `${TABLE_PREFIX}board_columns`,
        ["board_id"],
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
      await queryInterface.removeColumn(
        `${TABLE_PREFIX}issues`,
        "board_order",
        { transaction },
      );
      await queryInterface.dropTable(`${TABLE_PREFIX}board_columns`, {
        transaction,
      });
      await queryInterface.dropTable(`${TABLE_PREFIX}boards`, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
