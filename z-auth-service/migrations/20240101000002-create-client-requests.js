'use strict';

/**
 * Create client_requests table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('client_requests')) {
      console.log('✅ client_requests already exists, skipping...');
      return;
    }

    await queryInterface.createTable('client_requests', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      client_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      redirect_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      description: Sequelize.TEXT,
      developer_email: Sequelize.STRING(255),
      developer_name: Sequelize.STRING(255),
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      requested_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      approved_at: Sequelize.DATE,
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        // NOTE: FK to user_metadata added after that table is created
      },
      rejection_reason: Sequelize.TEXT,
      metadata: Sequelize.JSON,
    });
  },

  down: async (queryInterface) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('client_requests')) {
      await queryInterface.dropTable('client_requests');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_client_requests_status";');
    }
  },
};
