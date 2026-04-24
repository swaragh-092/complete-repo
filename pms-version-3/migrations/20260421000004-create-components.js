'use strict';

// Migration: Create pms_components table for Site-type projects.
// Components are the leaf-level work items within a Section, mirroring
// the role UserStories play in Application-type projects.
// Full lifecycle: timer, helper pattern, approval, sprint assignment.
// Hierarchy: Page → Section → Component

const TABLE_PREFIX = (process.env.DB_PREFIX || 'pms') + '_';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        `${TABLE_PREFIX}components`,
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
          section_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: { model: `${TABLE_PREFIX}sections`, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          parent_component_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: `${TABLE_PREFIX}components`, key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
            comment: 'Self-referencing FK for sub-components / tasks',
          },
          department_id: {
            type: Sequelize.UUID,
            allowNull: false,
          },
          type: {
            type: Sequelize.ENUM('component', 'task'),
            defaultValue: 'component',
            allowNull: false,
            comment: 'Distinguishes between a UI Component and a technical Task',
          },
          // Helper pattern (mirrors UserStory.story_for / helped_for)
          component_for: {
            type: Sequelize.ENUM('normal', 'help'),
            defaultValue: 'normal',
            allowNull: false,
            comment: 'Flags whether this is a helper component assisting another',
          },
          helped_for: {
            type: Sequelize.UUID,
            allowNull: true,
            comment: 'FK to the Component being helped. NULL for normal components.',
          },
          reporter_id: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          title: {
            type: Sequelize.STRING(255),
            allowNull: false,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          acceptance_criteria: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          status: {
            type: Sequelize.ENUM(
              'defined',
              'in_progress',
              'review',
              'completed',
              'blocked',
              'accept_pending',
              'reject'
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
          assignee: {
            type: Sequelize.UUID,
            allowNull: true,
            comment: 'User who assigned or creator',
          },
          assigned_to: {
            type: Sequelize.UUID,
            allowNull: true,
            comment: 'User performing the work',
          },
          approval_status: {
            type: Sequelize.ENUM('pending', 'approved', 'rejected', 'not_required'),
            defaultValue: 'not_required',
            allowNull: false,
          },
          approved_by: {
            type: Sequelize.UUID,
            allowNull: true,
          },
          story_points: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          due_date: {
            type: Sequelize.DATEONLY,
            allowNull: true,
          },
          completed_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          total_work_time: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            comment: 'Time spent in minutes',
          },
          timer_started_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          timer_status: {
            type: Sequelize.ENUM('running', 'stopped'),
            defaultValue: 'stopped',
            allowNull: false,
          },
          sprint_id: {
            type: Sequelize.UUID,
            allowNull: true,
            references: { model: `${TABLE_PREFIX}sprints`, key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          board_order: {
            type: Sequelize.FLOAT,
            defaultValue: 65535.0,
          },
          sort_order: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
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

      await queryInterface.addIndex(`${TABLE_PREFIX}components`, ['project_id'], {
        name: 'idx_components_project_id',
        transaction,
      });
      await queryInterface.addIndex(`${TABLE_PREFIX}components`, ['section_id'], {
        name: 'idx_components_section_id',
        transaction,
      });
      await queryInterface.addIndex(`${TABLE_PREFIX}components`, ['sprint_id'], {
        name: 'idx_components_sprint_id',
        transaction,
      });
      await queryInterface.addIndex(
        `${TABLE_PREFIX}components`,
        ['parent_component_id'],
        { name: 'idx_components_parent_component_id', transaction }
      );
      await queryInterface.addIndex(
        `${TABLE_PREFIX}components`,
        ['helped_for'],
        { name: 'idx_components_helped_for', transaction }
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable(`${TABLE_PREFIX}components`);
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}components_type";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}components_component_for";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}components_status";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}components_priority";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}components_approval_status";`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_${TABLE_PREFIX}components_timer_status";`
    );
  },
};
