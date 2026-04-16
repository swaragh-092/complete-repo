'use strict';

/**
 * Migration: Create workspace_invitations table
 * For sending email invitations to join a workspace
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('workspace_invitations', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            workspace_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'workspaces',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            invited_email: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            role: {
                type: Sequelize.ENUM('admin', 'editor', 'viewer'),
                allowNull: false,
                defaultValue: 'viewer'
            },
            code_hash: {
                type: Sequelize.STRING(64),
                allowNull: false,
                unique: true
            },
            invited_by: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'user_metadata',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            accepted_by: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'user_metadata',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            accepted_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            message: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('pending', 'accepted', 'expired', 'revoked'),
                defaultValue: 'pending'
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            }
        });

        // Add indexes for performance
        await queryInterface.addIndex('workspace_invitations', ['workspace_id']);
        await queryInterface.addIndex('workspace_invitations', ['invited_email']);
        await queryInterface.addIndex('workspace_invitations', ['code_hash'], { unique: true });
        await queryInterface.addIndex('workspace_invitations', ['status']);
        await queryInterface.addIndex('workspace_invitations', ['expires_at']);
        await queryInterface.addIndex('workspace_invitations', ['invited_by']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('workspace_invitations');
    }
};
