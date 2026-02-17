'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const EmailLog = sequelize.define('EmailLog', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Email type (CLIENT_REQUEST, CLIENT_APPROVED, etc.)',
        },
        to: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Recipient email address',
        },
        subject: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Rendered email subject line',
        },
        status: {
            type: DataTypes.ENUM('queued', 'sending', 'sent', 'failed'),
            allowNull: false,
            defaultValue: 'queued',
        },
        attempts: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        // ── Multi-Tenant Tracking ──────────────────────────────────────
        scope: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'system',
            comment: 'Context level: system | organization | user',
            validate: {
                isIn: [['system', 'organization', 'user']],
            },
        },
        org_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'Organization context (null for system-scoped)',
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: 'User context (null for system-scoped)',
        },
        client_key: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Client that triggered this email (admin-ui, account-ui)',
        },
        service_name: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'Calling service (auth-service, pms, super-admin)',
        },

        // ── Delivery Info ──────────────────────────────────────────────
        sent_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        failed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        error: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Error message if sending failed',
        },
        message_id: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'SMTP message ID returned by provider',
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Template data and extra context',
        },
    }, {
        tableName: 'email_logs',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['status'] },
            { fields: ['type'] },
            { fields: ['to'] },
            { fields: ['created_at'] },
            { fields: ['org_id'] },
            { fields: ['user_id'] },
            { fields: ['scope'] },
            { fields: ['client_key'] },
            { fields: ['scope', 'org_id'] },    // composite: org-scoped queries
            { fields: ['service_name', 'type'] }, // composite: service analytics
        ],
    });

    return EmailLog;
};