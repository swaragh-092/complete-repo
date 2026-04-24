'use strict';

const TABLE_PREFIX = "pms_";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = `${TABLE_PREFIX}projects`;

    await queryInterface.addColumn(tableName, 'type', {
      type: Sequelize.ENUM('application', 'site'),
      allowNull: false,
      defaultValue: 'site',
    });
  },

  async down(queryInterface, Sequelize) {
    const tableName = `${TABLE_PREFIX}projects`;

    await queryInterface.removeColumn(tableName, 'type');
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${tableName}_type";`
    );
  }
};
