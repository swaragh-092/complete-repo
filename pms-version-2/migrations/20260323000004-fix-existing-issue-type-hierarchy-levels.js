"use strict";

/**
 * Fix issue types that were accidentally created with hierarchy_level=3 (Subtask)
 * because the old model default was 3. These should be level 2 (Story) as they are
 * user-defined general-purpose types, not subtasks.
 *
 * This only updates rows where hierarchy_level=3 AND no issue currently uses them
 * as a subtask with a parent_issue_id — so legitimate subtask types are preserved.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Update issue types that have hierarchy_level=3 but are not actually being used
    // as subtask parents (i.e., no issue with this type has a parent_issue_id set).
    // Safest approach: update all level-3 types that have no child issues depending on them.
    await queryInterface.sequelize.query(`
      UPDATE pms_issue_types
      SET hierarchy_level = 2
      WHERE hierarchy_level = 3
        AND deleted_at IS NULL
        AND id NOT IN (
          SELECT DISTINCT issue_type_id
          FROM pms_issues
          WHERE parent_id IS NOT NULL
            AND deleted_at IS NULL
        )
    `);
  },

  async down(queryInterface, Sequelize) {
    // Not reversible — we don't know which types were originally set to 3
  },
};
