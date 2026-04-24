'use strict';

// Migration: Extend pms_issues to support Site-type linked work items.
// Adds three nullable FK columns: page_id, section_id, component_id.
// The existing user_story_id column is untouched (Application-type).
// A CHECK constraint ensures at most one FK column is set per issue row.

const TABLE_PREFIX = (process.env.DB_PREFIX || 'pms') + '_';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const issuesTable = `${TABLE_PREFIX}issues`;
    try {
      await queryInterface.addColumn(
        issuesTable,
        'page_id',
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: `${TABLE_PREFIX}pages`, key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          comment: 'Linked Page (Site-type projects)',
        },
        { transaction }
      );

      await queryInterface.addColumn(
        issuesTable,
        'section_id',
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: `${TABLE_PREFIX}sections`, key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          comment: 'Linked Section (Site-type projects)',
        },
        { transaction }
      );

      await queryInterface.addColumn(
        issuesTable,
        'component_id',
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: `${TABLE_PREFIX}components`, key: 'id' },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
          comment: 'Linked Component (Site-type projects)',
        },
        { transaction }
      );

      // Ensure at most one linked-item FK is non-null per row
      await queryInterface.sequelize.query(
        `ALTER TABLE "${issuesTable}"
         ADD CONSTRAINT chk_issue_linked_item CHECK (
           (user_story_id IS NOT NULL)::int +
           (page_id IS NOT NULL)::int +
           (section_id IS NOT NULL)::int +
           (component_id IS NOT NULL)::int <= 1
         )`,
        { transaction }
      );

      await queryInterface.addIndex(issuesTable, ['page_id'], {
        name: 'idx_issues_page_id',
        transaction,
      });
      await queryInterface.addIndex(issuesTable, ['section_id'], {
        name: 'idx_issues_section_id',
        transaction,
      });
      await queryInterface.addIndex(issuesTable, ['component_id'], {
        name: 'idx_issues_component_id',
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    const issuesTable = `${TABLE_PREFIX}issues`;
    try {
      await queryInterface.sequelize.query(
        `ALTER TABLE "${issuesTable}" DROP CONSTRAINT IF EXISTS chk_issue_linked_item`,
        { transaction }
      );
      await queryInterface.removeColumn(issuesTable, 'component_id', { transaction });
      await queryInterface.removeColumn(issuesTable, 'section_id', { transaction });
      await queryInterface.removeColumn(issuesTable, 'page_id', { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
