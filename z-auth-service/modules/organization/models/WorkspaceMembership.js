'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class WorkspaceMembership extends Model {
        static associate(models) {
            WorkspaceMembership.belongsTo(models.Workspace, {
                foreignKey: 'workspace_id',
                targetKey: 'id',
                as: 'Workspace'
            });

            WorkspaceMembership.belongsTo(models.UserMetadata, {
                foreignKey: 'user_id',
                targetKey: 'id',
                as: 'UserMetadata'
            });
        }
    }

    WorkspaceMembership.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            workspace_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            role: {
                type: DataTypes.ENUM('viewer', 'editor', 'admin'),
                allowNull: false,
                defaultValue: 'viewer'
            },
            status: {
                type: DataTypes.ENUM('active', 'invited', 'suspended'),
                allowNull: false,
                defaultValue: 'active'
            },
            created_by: {
                type: DataTypes.UUID,
                allowNull: true,
            }
        },
        {
            sequelize,
            modelName: 'WorkspaceMembership',
            tableName: 'workspace_memberships',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                { fields: ['workspace_id'] },
                { fields: ['user_id'] },
                { fields: ['workspace_id', 'user_id'], unique: true }
            ]
        }
    );

    return WorkspaceMembership;
};
