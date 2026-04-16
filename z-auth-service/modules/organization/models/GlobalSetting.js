'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class GlobalSetting extends Model {
        static associate(models) {
            // Setup associations if necessary
            // e.g. updated_by -> UserMetadata (if we want strict FKs)
            GlobalSetting.belongsTo(models.UserMetadata, {
                foreignKey: 'updated_by',
                as: 'Updater',
                constraints: false // Loose connection since system might update it
            });
        }
    }

    GlobalSetting.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            key: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                comment: "The unique identifier (e.g., 'MAX_WORKSPACES_PER_ORG')"
            },
            value: {
                type: DataTypes.JSONB,
                allowNull: false,
                comment: 'JSONB handles native types (numbers, booleans, arrays, objects) automatically'
            },
            type: {
                type: DataTypes.ENUM('number', 'boolean', 'string', 'json'),
                defaultValue: 'string',
                comment: 'Strong typing validation layer'
            },
            category: {
                type: DataTypes.ENUM('limits', 'security', 'features', 'branding', 'system'),
                defaultValue: 'system',
                comment: 'Logical grouping for UI'
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true,
                comment: 'UX text for admins'
            },
            is_system: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                comment: 'If true, this config cannot be deleted (core system config)'
            },
            is_public: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                comment: 'If true, the value is safe to expose to unauthenticated clients'
            },
            updated_by: {
                type: DataTypes.UUID,
                allowNull: true,
                comment: 'Audit trail: UUID of super admin who last modified it'
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            }
        },
        {
            sequelize,
            modelName: 'GlobalSetting',
            tableName: 'global_settings',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            indexes: [
                { unique: true, fields: ['key'] },
                { fields: ['category'] },
                { fields: ['is_public'] }
            ]
        }
    );

    return GlobalSetting;
};
