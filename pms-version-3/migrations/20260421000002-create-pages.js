'use strict';

// Migration: Create pms_pages table for Site-type projects.
// Pages are the top-level structural entity in Site-type projects,
// replacing Features that are used in Application-type projects.
// Hierarchy: Page → Section → Component

const TABLE_PREFIX = (process.env.DB_PREFIX || 'pms') + '_';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        `${TABLE_PREFIX}pages`,
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
          parent_page_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: `${TABLE_PREFIX}pages`, key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
            comment: 'Self-referencing FK for sub-pages (e.g. /about/team)',
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
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          url_slug: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Site-specific: URL path for this page (e.g. /contact-us)',
          },
          status: {
            type: Sequelize.ENUM('active', 'inactive'),
            defaultValue: 'active',
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

      await queryInterface.addIndex(`${TABLE_PREFIX}pages`, ['project_id'], {
        name: 'idx_pages_project_id',
        transaction,
      });
      await queryInterface.addIndex(`${TABLE_PREFIX}pages`, ['department_id'], {
        name: 'idx_pages_department_id',
        transaction,
      });
      await queryInterface.addIndex(`${TABLE_PREFIX}pages`, ['parent_page_id'], {
        name: 'idx_pages_parent_page_id',
        transaction,
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable(`${TABLE_PREFIX}pages`);
    // Drop ENUMs created for this table
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}pages_status";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}pages_priority";`
    );
  },
};
