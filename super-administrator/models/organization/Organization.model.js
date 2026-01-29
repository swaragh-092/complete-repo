// Author : Gururaj
// Created: 30th July 2025
// Description: Organization model
// Version: 1.0.0
// Modified: 

const {ORGANIZATION_STATE_ENUM_VALUES, UNWANTED_FILEDS} = require("../../util/constant");
module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
    const Organization = sequelize.define('Organization', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        code : {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            // comment : "Auto generated unique code for organization used for internal logic like permission checks",
        },
        email : {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        logo_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phone : {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                is: /^\+?[1-9]\d{1,14}$/, // E.164 format
            },
        },
        state: {
            type: DataTypes.ENUM(...ORGANIZATION_STATE_ENUM_VALUES),
            allowNull: false,
            defaultValue: "active", 
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        owner_keycloak_id : {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        ...commonFields()
    }, {
        tableName: tablePrefix + 'organizations',
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

    commonFields(Organization); // common fields auto fill

    Organization.associate = (models)=> {
        
        Organization.hasOne(models.OrganizationLocation, {
            foreignKey: 'organization_id',
            as: "location"
        });
        
        Organization.hasOne(models.EmailPackage, {
            foreignKey: 'organization_id',
            as: "email_package"
        });
        Organization.hasOne(models.SMSPackage, {
            foreignKey: 'organization_id',
            as: "sms_package"
        });
        Organization.hasOne(models.OrganizationUsageLimits, {
            foreignKey: 'organization_id',
            as: "usage"
        });
        Organization.hasMany(models.Codebase, {
            foreignKey: 'organization_id',
            as: "codebase"
        });
        Organization.hasMany(models.Database, {
            foreignKey: 'organization_id',
            as: "database"
        });
        Organization.hasOne(models.Domain, {
            foreignKey: 'organization_id',
            as: "domain"
        });


        Organization.hasMany(models.SubscriptionPause, {
            foreignKey: 'organization_id',
            as: "pause"
        });
        // Organization.hasMany(models.SubscriptionPauseCompleted, {
        //     foreignKey: 'organization_id',
        //     as: "completed_pause"
        // });
        Organization.hasMany(models.OrganizationAdmin,{
            foreignKey: 'organization_id',
            as: "admins"
        });
        
        Organization.hasMany(models.Invoice, {
            foreignKey: 'organization_id',
            as: 'invoices',
        });

        Organization.hasMany(models.Payment, {
            foreignKey: "organization_id",
            as: "payments",
        });
        Organization.hasMany(models.OrganizationUsageHistory, {
            foreignKey: "organization_id",
            as: "usage_history",
        });

        Organization.hasMany(models.OrganizationSubscription, {
            foreignKey: 'organization_id',
            as: 'subscriptions',
        }); 

        Organization.hasMany(models.OrganizationTrials, {
            foreignKey: 'organization_id',
            as: 'trials',
        }); 



    }

    return Organization;
};