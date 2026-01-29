'use strict';

/**
 * Create permissions table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('permissions')) {
      console.log('✅ permissions already exists, skipping...');
      return;
    }

    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.fn('gen_random_uuid'),
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: Sequelize.TEXT,
      resource: Sequelize.STRING(50),
      action: Sequelize.STRING(50),
      is_system: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
    await queryInterface.addIndex('permissions', ['name']);
    await queryInterface.addIndex('permissions', ['resource']);
    await queryInterface.addIndex('permissions', ['action']);
    await queryInterface.addIndex('permissions', ['is_system']);
  },

  down: async (queryInterface) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('permissions')) {
      await queryInterface.dropTable('permissions');
    }
  },
};
