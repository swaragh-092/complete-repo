'use strict';

/**
 * Migration: Add client_id to Roles and Permissions tables
 * 
 * PURPOSE: Enable Multi-App Role Visibility
 * - Roles with client_id = NULL are global (visible to all apps)
 * - Roles with a specific client_id are only visible to that app
 * - Same logic applies to Permissions for full isolation
 */

module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Add client_id to roles table
            await queryInterface.addColumn('roles', 'client_id', {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'Client/App scope (NULL = global, visible to all apps)',
                references: {
                    model: 'clients',
                    key: 'client_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }, { transaction });

            // Add client_id to permissions table
            await queryInterface.addColumn('permissions', 'client_id', {
                type: Sequelize.STRING(100),
                allowNull: true,
                comment: 'Client/App scope (NULL = global permission)',
                references: {
                    model: 'clients',
                    key: 'client_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            }, { transaction });

            // Add index for efficient querying by client_id
            await queryInterface.addIndex('roles', ['client_id'], {
                name: 'roles_client_id_idx',
                transaction
            });

            await queryInterface.addIndex('permissions', ['client_id'], {
                name: 'permissions_client_id_idx',
                transaction
            });

            await transaction.commit();
            console.log('✅ Added client_id columns to roles and permissions tables');
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            await queryInterface.removeIndex('permissions', 'permissions_client_id_idx', { transaction });
            await queryInterface.removeIndex('roles', 'roles_client_id_idx', { transaction });
            await queryInterface.removeColumn('permissions', 'client_id', { transaction });
            await queryInterface.removeColumn('roles', 'client_id', { transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};
