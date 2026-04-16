'use strict';

/**
 * Migration: Add organization-related fields to clients and client_requests tables
 * 
 * Fields added:
 * - requires_organization (BOOLEAN)
 * - organization_model (ENUM)
 * - organization_features (JSON)
 * - onboarding_flow (ENUM)
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            // 1. Define ENUMs first if they don't exist
            // Note: Sequelize handles ENUM creation automatically with changeColumn/addColumn usually, 
            // but for PostgreSQL we might need to be careful if the type already exists.
            // We'll let Sequelize handle it but use a try-catch block for the ENUM type creation specifically if needed.
            // However, addColumn with type ENUM usually works fine.

            const tables = ['clients', 'client_requests'];
            const newColumns = [
                {
                    name: 'requires_organization',
                    definition: {
                        type: Sequelize.BOOLEAN,
                        defaultValue: false,
                        allowNull: true
                    }
                },
                {
                    name: 'organization_model',
                    definition: {
                        type: Sequelize.ENUM('single', 'multi', 'workspace', 'enterprise'),
                        allowNull: true
                    }
                },
                {
                    name: 'organization_features',
                    definition: {
                        type: Sequelize.JSON,
                        allowNull: true,
                        comment: 'Features enabled for organizations in this client'
                    }
                },
                {
                    name: 'onboarding_flow',
                    definition: {
                        type: Sequelize.ENUM('create_org', 'invitation_only', 'domain_matching', 'flexible'),
                        allowNull: true
                    }
                }
            ];

            for (const table of tables) {
                const tableDescription = await queryInterface.describeTable(table);

                for (const col of newColumns) {
                    if (!tableDescription[col.name]) {
                        console.log(`Adding ${col.name} to ${table}...`);
                        await queryInterface.addColumn(table, col.name, col.definition, { transaction });
                    } else {
                        console.log(`Column ${col.name} already exists in ${table}, skipping...`);
                    }
                }
            }

            await transaction.commit();
            console.log('✅ Migration completed successfully');

        } catch (error) {
            await transaction.rollback();
            console.error('❌ Migration failed:', error);
            throw error;
        }
    },

    down: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();

        try {
            const tables = ['clients', 'client_requests'];
            const columnsToRemove = [
                'requires_organization',
                'organization_model',
                'organization_features',
                'onboarding_flow'
            ];

            for (const table of tables) {
                for (const col of columnsToRemove) {
                    console.log(`Removing ${col} from ${table}...`);
                    await queryInterface.removeColumn(table, col, { transaction });
                }
            }

            // Note: We are NOT dropping the ENUM types here to avoid side effects if other tables were to use them
            // (though currently only these two do). 
            // If we wanted to drop them:
            // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_clients_organization_model";', { transaction });
            // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_clients_onboarding_flow";', { transaction });
            // ... and similarly for client_requests (Sequelize names them enum_<table>_<col>)

            await transaction.commit();
            console.log('✅ Rollback completed successfully');

        } catch (error) {
            await transaction.rollback();
            console.error('❌ Rollback failed:', error);
            throw error;
        }
    }
};
