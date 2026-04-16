"use strict";

/**
 * Add 'tester' as a valid project_role for ProjectMember.
 * Testers can create issues; team leads (lead) can link issues to user stories.
 */
module.exports = {
  async up(queryInterface) {
    // PostgreSQL: add new value to existing enum type
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_pms_project_members_project_role ADD VALUE IF NOT EXISTS 'tester'
    `);
  },

  async down(queryInterface) {
    // PostgreSQL cannot remove enum values; we annotate but leave the type intact
    // (removing enum values requires recreating the type, which is complex)
    await queryInterface.sequelize.query(`
      UPDATE pms_project_members SET project_role = 'member' WHERE project_role = 'tester'
    `);
  },
};
