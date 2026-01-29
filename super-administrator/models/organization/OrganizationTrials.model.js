// Author : Gururaj
// Created: 30th July 2025
// Description: Organization previous trials so that to make trial should not repeat 
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const OrganizationTrial = sequelize.define('OrganizationTrial', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        organization_id : {
            type: DataTypes.UUID,
            allowNull : false,
        },
        subscription_id : {
            type: DataTypes.UUID,
            allowNull : false,
        },
        subscription_history_id : {
            type: DataTypes.UUID,
            allowNull : false,
        },
        plan_id : {
             type: DataTypes.UUID,
            allowNull : false,
        },

        ...commonFields()
    }, {
        tableName: tablePrefix + 'organization_trials',
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

    commonFields(OrganizationTrial); // common fields auto fill

    OrganizationTrial.associate = (models)=> {
        
        OrganizationTrial.belongsTo(models.Organization, {
            foreignKey: 'organization_id',
            as: "organization",
        });

    }

    return OrganizationTrial;
};