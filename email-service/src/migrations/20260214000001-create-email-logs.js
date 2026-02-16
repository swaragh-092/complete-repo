'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Create the ENUM type first
        await queryInterface.sequelize.query(`
            DO $$ BEGIN
                CREATE TYPE "enum_email_logs_status" AS ENUM ('queued', 'sending', 'sent', 'failed');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryInterface.createTable('email_logs', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            type: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'Email type (CLIENT_REQUEST, CLIENT_APPROVED, etc.)',
            },
            to: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'Recipient email address',
            },
            subject: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'Rendered email subject line',
            },
            status: {
                type: Sequelize.ENUM('queued', 'sending', 'sent', 'failed'),
                allowNull: false,
                defaultValue: 'queued',
            },
            attempts: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            sent_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            failed_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            error: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Error message if sending failed',
            },
            message_id: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'SMTP message ID returned by provider',
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true,
                comment: 'Template data and extra context',
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('NOW()'),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('NOW()'),
            },
        });

        // Add indexes
        await queryInterface.addIndex('email_logs', ['status']);
        await queryInterface.addIndex('email_logs', ['type']);
        await queryInterface.addIndex('email_logs', ['to']);
        await queryInterface.addIndex('email_logs', ['created_at']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('email_logs');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_email_logs_status";');
    },
};
