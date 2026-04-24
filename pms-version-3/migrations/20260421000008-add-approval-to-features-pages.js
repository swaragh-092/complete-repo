'use strict';

const TABLE_PREFIX = 'pms_';

module.exports = {
  async up(queryInterface, Sequelize) {
    const featuresTable = `${TABLE_PREFIX}features`;
    const pagesTable = `${TABLE_PREFIX}pages`;

    // ── Features: add approval_status + approved_by ────────────────────────
    await queryInterface.addColumn(featuresTable, 'approval_status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected', 'not_required'),
      defaultValue: 'not_required',
      allowNull: false,
    });
    await queryInterface.addColumn(featuresTable, 'approved_by', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // ── Pages: add approval_status + approved_by ───────────────────────────
    await queryInterface.addColumn(pagesTable, 'approval_status', {
      type: Sequelize.ENUM('pending', 'approved', 'rejected', 'not_required'),
      defaultValue: 'not_required',
      allowNull: false,
    });
    await queryInterface.addColumn(pagesTable, 'approved_by', {
      type: Sequelize.UUID,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    const featuresTable = `${TABLE_PREFIX}features`;
    const pagesTable = `${TABLE_PREFIX}pages`;

    await queryInterface.removeColumn(featuresTable, 'approved_by');
    await queryInterface.removeColumn(featuresTable, 'approval_status');
    await queryInterface.removeColumn(pagesTable, 'approved_by');
    await queryInterface.removeColumn(pagesTable, 'approval_status');

    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${featuresTable}_approval_status";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${pagesTable}_approval_status";`
    );
  },
};
