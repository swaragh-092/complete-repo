'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('organization_requests', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            org_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'organizations',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            type: {
                type: Sequelize.ENUM('limit_increase', 'feature_access', 'other'),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('pending', 'approved', 'rejected'),
                defaultValue: 'pending',
                allowNull: false
            },
            details: {
                type: Sequelize.JSONB,
                allowNull: false,
                comment: 'Stores request specific info like requested setting and reason'
            },
            requested_by: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'user_metadata',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            resolved_by: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'user_metadata',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            resolved_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('organization_requests');

        // Explicitly drop ENUM types if in PostgreSQL (clean up)
        try {
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_organization_requests_type";');
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_organization_requests_status";');
        } catch (e) {
            // Ignore if sqlite
        }
    }
};
