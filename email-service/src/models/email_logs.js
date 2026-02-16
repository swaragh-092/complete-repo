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
        ],
    });

    return EmailLog;
};