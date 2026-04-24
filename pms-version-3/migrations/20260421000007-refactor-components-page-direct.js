'use strict';
// Migration: Refactor Component table to support direct Page → Component hierarchy.
// - Adds page_id (nullable) so components can attach directly to a page
// - Adds is_global flag for project-wide shared components (header, footer, navbar)
// - Makes section_id nullable (old Section → Component path no longer required)
// Architecture change: Page → Components/Tasks  (sections layer removed from UI)

const TABLE_PREFIX = (process.env.DB_PREFIX || 'pms') + '_';

module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // 1. Add page_id — direct reference from component to page
      await queryInterface.addColumn(
        `${TABLE_PREFIX}components`,
        'page_id',
        {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: `${TABLE_PREFIX}pages`, key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          comment: 'Direct FK to page — bypasses sections for flat Page→Component hierarchy',
        },
        { transaction: t }
      );

      // 2. Add is_global — marks project-wide shared components (header, footer)
      await queryInterface.addColumn(
        `${TABLE_PREFIX}components`,
        'is_global',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: 'True for project-wide shared components (header, footer, navbar)',
        },
        { transaction: t }
      );

      // 3. Make section_id nullable — existing section-based records unaffected
      await queryInterface.sequelize.query(
        `ALTER TABLE ${TABLE_PREFIX}components ALTER COLUMN section_id DROP NOT NULL`,
        { transaction: t }
      );

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn(`${TABLE_PREFIX}components`, 'page_id', { transaction: t });
      await queryInterface.removeColumn(`${TABLE_PREFIX}components`, 'is_global', { transaction: t });
      // Restore NOT NULL on section_id — will fail if any null rows exist
      await queryInterface.sequelize.query(
        `ALTER TABLE ${TABLE_PREFIX}components ALTER COLUMN section_id SET NOT NULL`,
        { transaction: t }
      );
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },
};
