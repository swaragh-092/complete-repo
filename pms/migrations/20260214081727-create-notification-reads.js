'use strict';


const TABLE_PREFIX = process.env.DB_PREFIX + "_";

const tableName = TABLE_PREFIX + "notification_reads";

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable(tableName, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      notification_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: TABLE_PREFIX + "notifications",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      read_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      // Common fields
      organization_id: Sequelize.UUID,
      created_by: Sequelize.UUID,
      updated_by: Sequelize.UUID,
      created_ip: Sequelize.STRING(45),
      updated_ip: Sequelize.STRING(45),
      created_user_agent: Sequelize.STRING(255),
      updated_user_agent: Sequelize.STRING(255),

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },

      deleted_at: Sequelize.DATE,
    });

    // 🔥 Prevent duplicate reads per user
    await queryInterface.addConstraint(
      tableName,
      {
        fields: ["notification_id", "user_id"],
        type: "unique",
        name:
          tableName + "_reads_notification_user_unique",
      }
    );

    // 🔥 Useful indexes
    await queryInterface.addIndex(
      tableName,
      ["user_id"],
      { name: tableName+"_reads_user_idx" }
    );

    await queryInterface.addIndex(
      tableName,
      ["notification_id"],
      { name: tableName+"_reads_notification_idx" }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable(tableName);
  },
};
