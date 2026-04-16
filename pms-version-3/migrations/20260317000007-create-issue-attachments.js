"use strict";

const TABLE_PREFIX = "pms_";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        `${TABLE_PREFIX}issue_attachments`,
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          issue_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: `${TABLE_PREFIX}issues`,
              key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
          user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            comment: "Uploader ID (from auth-service)",
          },
          file_name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          file_path: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          file_type: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          file_size: {
            type: Sequelize.INTEGER,
            allowNull: true,
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

      // Add index on issue_id
      await queryInterface.addIndex(
        `${TABLE_PREFIX}issue_attachments`,
        ["issue_id"],
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
      await queryInterface.dropTable(`${TABLE_PREFIX}issue_attachments`, {
        transaction,
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
