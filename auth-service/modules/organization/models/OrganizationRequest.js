'use strict';

module.exports = (sequelize, DataTypes) => {
    const OrganizationRequest = sequelize.define('OrganizationRequest', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        org_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('limit_increase', 'feature_access', 'other'),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending',
            allowNull: false
        },
        details: {
            type: DataTypes.JSONB,
            allowNull: false,
            comment: 'Stores request specific info like requested setting and reason'
        },
        requested_by: {
            type: DataTypes.UUID,
            allowNull: false
        },
        resolved_by: {
            type: DataTypes.UUID,
            allowNull: true
        },
        resolved_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'organization_requests',
        timestamps: true,
        underscored: true
    });

    OrganizationRequest.associate = function (models) {
        OrganizationRequest.belongsTo(models.Organization, {
            foreignKey: 'org_id',
            onDelete: 'CASCADE'
        });
        OrganizationRequest.belongsTo(models.UserMetadata, {
            foreignKey: 'requested_by',
            as: 'Requester'
        });
        OrganizationRequest.belongsTo(models.UserMetadata, {
            foreignKey: 'resolved_by',
            as: 'Resolver'
        });
    };

    return OrganizationRequest;
};
