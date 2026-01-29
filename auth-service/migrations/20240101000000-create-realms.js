'use strict';

/**
 * Create realms table - foundation table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('realms')) {
      console.log('✅ realms already exists, skipping...');
      return;
    }

    await queryInterface.createTable('realms', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      realm_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      display_name: Sequelize.STRING(255),
      tenant_id: Sequelize.STRING(50),
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  down: async (queryInterface) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('realms')) {
      await queryInterface.dropTable('realms');
    }
  },
};

