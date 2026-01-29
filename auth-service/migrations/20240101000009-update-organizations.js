'use strict';

/**
 * Migration to update organizations table with additional columns.
 * Made idempotent - checks if columns exist before adding.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('organizations');

    // Add tenant_id if it doesn't exist
    if (!tableDescription.tenant_id) {
      await queryInterface.addColumn('organizations', 'tenant_id', {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: true
      });
    }

    // Add status if it doesn't exist
    if (!tableDescription.status) {
      await queryInterface.addColumn('organizations', 'status', {
        type: Sequelize.ENUM('pending', 'active', 'suspended', 'inactive'),
        defaultValue: 'active',
        allowNull: false
      });
    }

    // Add provisioned if it doesn't exist
    if (!tableDescription.provisioned) {
      await queryInterface.addColumn('organizations', 'provisioned', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Whether org was created by admin vs self-service'
      });
    }

    // Add settings if it doesn't exist
    if (!tableDescription.settings) {
      await queryInterface.addColumn('organizations', 'settings', {
        type: Sequelize.JSON,
        defaultValue: {},
        allowNull: false,
        comment: 'Organization-specific settings'
      });
    }

    // Add indexes (ignore errors if they exist)
    try { await queryInterface.addIndex('organizations', ['tenant_id']); } catch (e) { /* ignore */ }
    try { await queryInterface.addIndex('organizations', ['status']); } catch (e) { /* ignore */ }
    try { await queryInterface.addIndex('organizations', ['provisioned']); } catch (e) { /* ignore */ }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first (ignore errors if they don't exist)
    try { await queryInterface.removeIndex('organizations', ['tenant_id']); } catch (e) { /* ignore */ }
    try { await queryInterface.removeIndex('organizations', ['status']); } catch (e) { /* ignore */ }
    try { await queryInterface.removeIndex('organizations', ['provisioned']); } catch (e) { /* ignore */ }

    // Remove columns (ignore errors if they don't exist)
    try { await queryInterface.removeColumn('organizations', 'tenant_id'); } catch (e) { /* ignore */ }
    try { await queryInterface.removeColumn('organizations', 'status'); } catch (e) { /* ignore */ }
    try { await queryInterface.removeColumn('organizations', 'provisioned'); } catch (e) { /* ignore */ }
    try { await queryInterface.removeColumn('organizations', 'settings'); } catch (e) { /* ignore */ }

    // Drop ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_organizations_status";');
  }
};
