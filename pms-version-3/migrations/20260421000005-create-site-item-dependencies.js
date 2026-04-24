'use strict';

// Migration: Create pms_site_item_dependencies table for Site-type projects.
// A polymorphic dependency table that supports page→page, section→section,
// component→component, and cross-level dependencies (e.g. component blocked
// by a section finishing).
// Application-type projects keep using pms_user_story_dependencies — untouched.

const TABLE_PREFIX = (process.env.DB_PREFIX || 'pms') + '_';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        `${TABLE_PREFIX}site_item_dependencies`,
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
          // The item that HAS the dependency (is blocked by target)
          source_type: {
            type: Sequelize.ENUM('page', 'section', 'component'),
            allowNull: false,
          },
          source_id: {
            type: Sequelize.UUID,
            allowNull: false,
            comment: 'ID of the blocking item (page/section/component)',
          },
          // The item that must be completed first (blocks source)
          target_type: {
            type: Sequelize.ENUM('page', 'section', 'component'),
            allowNull: false,
          },
          target_id: {
            type: Sequelize.UUID,
            allowNull: false,
            comment: 'ID of the item that must be completed first',
          },
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
        },
        { transaction }
      );

      // Prevent duplicate dependency pairs
      await queryInterface.addIndex(
        `${TABLE_PREFIX}site_item_dependencies`,
        ['source_type', 'source_id', 'target_type', 'target_id'],
        {
          unique: true,
          name: 'uq_site_item_dependency_pair',
          transaction,
        }
      );

      await queryInterface.addIndex(
        `${TABLE_PREFIX}site_item_dependencies`,
        ['project_id'],
        { name: 'idx_site_item_dep_project_id', transaction }
      );
      await queryInterface.addIndex(
        `${TABLE_PREFIX}site_item_dependencies`,
        ['source_type', 'source_id'],
        { name: 'idx_site_item_dep_source', transaction }
      );
      await queryInterface.addIndex(
        `${TABLE_PREFIX}site_item_dependencies`,
        ['target_type', 'target_id'],
        { name: 'idx_site_item_dep_target', transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable(`${TABLE_PREFIX}site_item_dependencies`);
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}site_item_dependencies_source_type";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}site_item_dependencies_target_type";`
    );
  },
};
