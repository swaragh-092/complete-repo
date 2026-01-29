'use strict';

/**
 * Create organization_memberships table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('organization_memberships')) {
      console.log('✅ organization_memberships already exists, skipping...');
      return;
    }

    await queryInterface.createTable('organization_memberships', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.fn('gen_random_uuid'),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'user_metadata', key: 'id' },
        onDelete: 'CASCADE',
      },
      org_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'organizations', key: 'id' },
        onDelete: 'CASCADE',
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onDelete: 'RESTRICT',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addConstraint('organization_memberships', {
      fields: ['user_id', 'org_id', 'role_id'],
      type: 'unique',
      name: 'org_memberships_unique',
    });

    await queryInterface.addIndex('organization_memberships', ['user_id']);
    await queryInterface.addIndex('organization_memberships', ['org_id']);
  },

  down: async (queryInterface) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('organization_memberships')) {
      await queryInterface.dropTable('organization_memberships');
    }
  },
};
