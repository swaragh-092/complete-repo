"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const TABLE_PREFIX = (process.env.DB_PREFIX || "pms") + "_";
    const tableName = TABLE_PREFIX + "story_change_requests";

    await queryInterface.addColumn(tableName, "organization_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });

    await queryInterface.addColumn(tableName, "created_ip", {
      type: Sequelize.STRING(45),
      allowNull: true,
    });

    await queryInterface.addColumn(tableName, "updated_ip", {
      type: Sequelize.STRING(45),
      allowNull: true,
    });

    await queryInterface.addColumn(tableName, "created_user_agent", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn(tableName, "updated_user_agent", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    const TABLE_PREFIX = (process.env.DB_PREFIX || "pms") + "_";
    const tableName = TABLE_PREFIX + "story_change_requests";

    await queryInterface.removeColumn(tableName, "organization_id");
    await queryInterface.removeColumn(tableName, "created_ip");
    await queryInterface.removeColumn(tableName, "updated_ip");
    await queryInterface.removeColumn(tableName, "created_user_agent");
    await queryInterface.removeColumn(tableName, "updated_user_agent");
  },
};
