'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Workspace extends Model {
        static associate(models) {
            // Parent Organization
            Workspace.belongsTo(models.Organization, {
                foreignKey: 'org_id',
                targetKey: 'id',
                as: 'Organization'
            });

            // Memberships
            Workspace.hasMany(models.WorkspaceMembership, {
                foreignKey: 'workspace_id',
                sourceKey: 'id',
                as: 'Memberships'
            });

            // Creator
            Workspace.belongsTo(models.UserMetadata, {
                foreignKey: 'created_by',
                targetKey: 'id',
                as: 'Creator'
            });
        }

        // Helper to check if user is a member
        async hasMember(userId) {
            const count = await sequelize.models.WorkspaceMembership.count({
                where: {
                    workspace_id: this.id,
                    user_id: userId,
                    status: 'active'
                }
            });
            return count > 0;
        }
    }

    Workspace.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            org_id: {
                type: DataTypes.UUID,
                allowNull: false,
                // References handled by association
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [2, 100]
                }
            },
            slug: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    is: /^[a-z0-9-]+$/i // URL friendly chars only
                }
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            settings: {
                type: DataTypes.JSONB,
                defaultValue: {},
                allowNull: false
            },
            created_by: {
                type: DataTypes.UUID,
                allowNull: true,
            },
            deleted_at: {
                type: DataTypes.DATE,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: 'Workspace',
            tableName: 'workspaces',
            timestamps: true,
            paranoid: true, // Enable Soft Deletes
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            deletedAt: 'deleted_at',
            indexes: [
                { fields: ['org_id'] },
                { fields: ['org_id', 'slug'], unique: true },
                { fields: ['deleted_at'] }
            ]
        }
    );

    return Workspace;
};
