// Author : Gururaj
// Created: 30th July 2025
// Description: Organization admins model
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const OrganizationAdmin = sequelize.define('OrganizationAdmin', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        organization_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        keycloak_user_id: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        ...commonFields()
    }, {
        tableName: tablePrefix + 'organization_admins',
        timestamps: true,
        underscored: true,
        defaultScope: {
            attributes: {
            exclude: UNWANTED_FILEDS
            },
        },
        paranoid: true,              // <-- Enables soft delete
        deletedAt: 'deleted_at'
    });

    commonFields(OrganizationAdmin);

    OrganizationAdmin.associate = (models)=> {
        OrganizationAdmin.belongsTo(models.Organization, {
            foreignKey: 'organization_id',
            as: "organization",
        });       

    }

    return OrganizationAdmin;
};