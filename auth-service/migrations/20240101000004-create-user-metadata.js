'use strict';

/**
 * Create user_metadata table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('user_metadata')) {
      console.log('✅ user_metadata already exists, skipping...');
      return;
    }

    await queryInterface.createTable('user_metadata', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.fn('gen_random_uuid'),
        primaryKey: true,
      },
      keycloak_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      email: Sequelize.STRING(255),
      org_id: {
        type: Sequelize.UUID,
        references: { model: 'organizations', key: 'id' },
      },
      designation: Sequelize.STRING(100),
      department: Sequelize.STRING(100),
      avatar_url: Sequelize.TEXT,
      mobile: Sequelize.STRING(20),
      gender: Sequelize.STRING(10),
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      last_login: Sequelize.DATE,
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
    await queryInterface.addIndex('user_metadata', ['keycloak_id']);
    await queryInterface.addIndex('user_metadata', ['org_id']);
    await queryInterface.addIndex('user_metadata', ['email']);
    await queryInterface.addIndex('user_metadata', ['is_active']);
  },

  down: async (queryInterface) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('user_metadata')) {
      await queryInterface.dropTable('user_metadata');
    }
  },
};

