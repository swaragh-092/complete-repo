'use strict';

// Migration: Create pms_sections table for Site-type projects.
// Sections belong to a Page and can be nested (sub-sections).
// They carry sprint assignment and a display order within their parent page.
// Hierarchy: Page → Section → Component

const TABLE_PREFIX = (process.env.DB_PREFIX || 'pms') + '_';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        `${TABLE_PREFIX}sections`,
        {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false,
          },
          project_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: `${TABLE_PREFIX}projects`, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          page_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: `${TABLE_PREFIX}pages`, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          parent_section_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: `${TABLE_PREFIX}sections`, key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'Self-referencing FK for nested sections',
          },
          department_id: {
            type: Sequelize.UUID,
            allowNull: false,
          },
          name: {
            type: Sequelize.STRING(100),
            allowNull: false,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          order_index: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false,
            comment: 'Display order within the parent page',
          },
          status: {
            type: Sequelize.ENUM(
              'defined',
              'in_progress',
              'review',
              'completed',
              'blocked'
            ),
            defaultValue: 'defined',
            allowNull: false,
          },
          status_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          priority: {
            type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
            defaultValue: 'medium',
            allowNull: false,
          },
          assignee_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          sprint_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: `${TABLE_PREFIX}sprints`, key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          // common fields
          organization_id: { type: Sequelize.UUID, allowNull: true },
          created_by: { type: Sequelize.UUID, allowNull: true },
          updated_by: { type: Sequelize.UUID, allowNull: true },
          created_ip: { type: Sequelize.STRING(45), allowNull: true },
          updated_ip: { type: Sequelize.STRING(45), allowNull: true },
          created_user_agent: { type: Sequelize.STRING(255), allowNull: true },
          updated_user_agent: { type: Sequelize.STRING(255), allowNull: true },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
        },
        { transaction }
      );

      await queryInterface.addIndex(`${TABLE_PREFIX}sections`, ['project_id'], {
        name: 'idx_sections_project_id',
        transaction,
      });
      await queryInterface.addIndex(`${TABLE_PREFIX}sections`, ['page_id'], {
        name: 'idx_sections_page_id',
        transaction,
      });
      await queryInterface.addIndex(`${TABLE_PREFIX}sections`, ['sprint_id'], {
        name: 'idx_sections_sprint_id',
        transaction,
      });
      await queryInterface.addIndex(
        `${TABLE_PREFIX}sections`,
        ['parent_section_id'],
        { name: 'idx_sections_parent_section_id', transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable(`${TABLE_PREFIX}sections`);
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}sections_status";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}sections_priority";`
    );
  },
};
