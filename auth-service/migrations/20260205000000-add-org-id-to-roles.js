'use strict';

/**
 * Migration: Add org_id to Roles for custom org-scoped roles
 * 
 * PURPOSE: Allow organizations to create custom roles
 * - System roles have org_id = NULL (global)
 * - Custom roles have org_id = <org-uuid> (org-scoped)
 */

module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // Check if column already exists
            const tableInfo = await queryInterface.describeTable('roles');

            if (!tableInfo.org_id) {
                await queryInterface.addColumn('roles', 'org_id', {
                    type: Sequelize.UUID,
                    allowNull: true,
                    comment: 'Organization scope (NULL = system role, UUID = org-specific custom role)',
                    references: {
                        model: 'organizations',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                }, { transaction });

                // Add index for efficient org-scoped queries
                await queryInterface.addIndex('roles', ['org_id'], {
                    name: 'roles_org_id_idx',
                    transaction
                });

                console.log('✅ Added org_id column to roles table');
            } else {
                console.log('⏭️  org_id column already exists, skipping...');
            }

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface) {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            await queryInterface.removeIndex('roles', 'roles_org_id_idx', { transaction });
            await queryInterface.removeColumn('roles', 'org_id', { transaction });
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};
