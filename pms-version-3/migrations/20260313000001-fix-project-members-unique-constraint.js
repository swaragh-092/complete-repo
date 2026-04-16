'use strict';

/**
 * Fix unique constraint on project_members table.
 * 
 * Previously: UNIQUE(project_id, user_id)
 *   — blocked adding the same user to the same project under different departments.
 * 
 * After: UNIQUE(project_id, user_id, department_id)
 *   — allows a user to be a member of the same project in multiple departments
 *     (e.g., the same person can work as both Developer and Designer).
 */

// const TABLE_PREFIX = process.env.DB_PREFIX + "_";
const TABLE_PREFIX = "pms_";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = `${TABLE_PREFIX}project_members`;
    const oldConstraintName = `${tableName}_project_user_unique`;
    const newConstraintName = `${tableName}_project_user_dept_unique`;

    // Remove the old UNIQUE(project_id, user_id) constraint
    await queryInterface.removeConstraint(tableName, oldConstraintName);

    // Add new UNIQUE(project_id, user_id, department_id) constraint
    await queryInterface.addConstraint(tableName, {
      fields: ['project_id', 'user_id', 'department_id'],
      type: 'unique',
      name: newConstraintName,
    });
  },

  async down(queryInterface, Sequelize) {
    const tableName = `${TABLE_PREFIX}project_members`;
    const oldConstraintName = `${tableName}_project_user_unique`;
    const newConstraintName = `${tableName}_project_user_dept_unique`;

    // Rollback: remove the new constraint
    await queryInterface.removeConstraint(tableName, newConstraintName);

    // Restore the old UNIQUE(project_id, user_id) constraint
    await queryInterface.addConstraint(tableName, {
      fields: ['project_id', 'user_id'],
      type: 'unique',
      name: oldConstraintName,
    });
  },
};
