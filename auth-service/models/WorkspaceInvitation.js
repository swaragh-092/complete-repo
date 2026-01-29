'use strict';
const { Model, DataTypes } = require('sequelize');
const crypto = require('crypto');
const { WORKSPACE_ROLES, INVITATION_STATUS } = require('../config/constants');

module.exports = (sequelize) => {
    class WorkspaceInvitation extends Model {
        static associate(models) {
            WorkspaceInvitation.belongsTo(models.Workspace, {
                foreignKey: 'workspace_id',
                targetKey: 'id',
                as: 'Workspace'
            });
            WorkspaceInvitation.belongsTo(models.UserMetadata, {
                foreignKey: 'invited_by',
                targetKey: 'id',
                as: 'Inviter'
            });
            WorkspaceInvitation.belongsTo(models.UserMetadata, {
                foreignKey: 'accepted_by',
                targetKey: 'id',
                as: 'Accepter'
            });
        }

        // Generate secure invitation code
        static generateCode() {
            return crypto.randomBytes(32).toString('hex');
        }

        // Hash invitation code for storage
        static hashCode(code) {
            return crypto.createHash('sha256').update(code).digest('hex');
        }

        // Verify invitation code
        verifyCode(code) {
            const hash = WorkspaceInvitation.hashCode(code);
            return this.code_hash === hash;
        }

        isExpired() {
            return new Date() > this.expires_at;
        }

        isAccepted() {
            return this.status === INVITATION_STATUS.ACCEPTED;
        }

        isPending() {
            return this.status === INVITATION_STATUS.PENDING && !this.isExpired();
        }
    }

    WorkspaceInvitation.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        workspace_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'workspaces', key: 'id' }
        },
        invited_email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: { isEmail: true }
        },
        role: {
            type: DataTypes.ENUM(...Object.values(WORKSPACE_ROLES)),
            allowNull: false,
            defaultValue: WORKSPACE_ROLES.VIEWER
        },
        code_hash: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true
        },
        invited_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'user_metadata', key: 'id' }
        },
        accepted_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'user_metadata', key: 'id' }
        },
        accepted_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        },
        message: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM(...Object.values(INVITATION_STATUS)),
            defaultValue: INVITATION_STATUS.PENDING
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'WorkspaceInvitation',
        tableName: 'workspace_invitations',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['workspace_id'] },
            { fields: ['invited_email'] },
            { fields: ['code_hash'], unique: true },
            { fields: ['status'] },
            { fields: ['expires_at'] },
            { fields: ['invited_by'] }
        ]
    });

    return WorkspaceInvitation;
};
