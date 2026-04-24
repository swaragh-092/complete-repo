'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pms_components', 'timer_started_by', {
      type: Sequelize.UUID,
      allowNull: true,
      defaultValue: null,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('pms_components', 'timer_started_by');
  },
};
