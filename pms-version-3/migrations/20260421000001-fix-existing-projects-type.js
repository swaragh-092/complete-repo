'use strict';

// Migration: Fix existing projects that were created with defaultValue 'site'
// before the project type feature was properly introduced.
// All pre-existing projects are Application-type projects.

const TABLE_PREFIX = (process.env.DB_PREFIX || 'pms') + '_';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `UPDATE "${TABLE_PREFIX}projects" SET type = 'application' WHERE type = 'site'`
    );
  },

  async down(queryInterface) {
    // Intentionally a no-op: there is no safe rollback for a bulk data correction.
    // If you need to undo this migration, manually set the rows you care about.
    console.warn(
      '[20260421000001] down: no-op — data correction cannot be auto-reversed.'
    );
  },
};
