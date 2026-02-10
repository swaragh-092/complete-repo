'use strict';

const {ACTION_ON_HISTORY} = require('../util/constant');

const TABLE_PREFIX = process.env.DB_PREFIX + "_";

const tableName = TABLE_PREFIX + "audit_logs";

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable(tableName, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },

      reference_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },

      table_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },


      snapshot: {
        type: Sequelize.JSON,
        allowNull: false,
      },

      updated_columns: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      remarks: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      organization_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },

      action: {
        type: Sequelize.ENUM(...ACTION_ON_HISTORY),
        allowNull: false,
      },

      user_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      user_agent: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },

      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },

      time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },

    });

    // 🔥 Important indexes for fast audit lookup
    await queryInterface.addIndex(
      tableName,
      ["reference_id"],
      { name: TABLE_PREFIX + "audit_logs_reference_idx" }
    );

    await queryInterface.addIndex(
      tableName,
      ["table_name"],
      { name: TABLE_PREFIX + "audit_logs_table_idx" }
    );
  },

  async down(queryInterface) {

    await queryInterface.dropTable(tableName);

    // Drop ENUM manually (Postgres)
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}audit_logs_table_name";`
    );
  },
};
