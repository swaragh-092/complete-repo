'use strict';

/**
 * Create audit_logs table - made idempotent
 * NOTE: May already exist from core-tables migration
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('audit_logs')) {
      console.log('✅ audit_logs already exists, skipping...');
      return;
    }

    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      org_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      user_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      client_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      action: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
    await queryInterface.addIndex('audit_logs', ['org_id']);
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['client_id']);
    await queryInterface.addIndex('audit_logs', ['action']);
  },

  down: async (queryInterface) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('audit_logs')) {
      await queryInterface.dropTable('audit_logs');
    }
  },
};

