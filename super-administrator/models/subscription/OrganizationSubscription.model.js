// Author : Gururaj
// Created: 31th July 2025
// Description: Organization subscription module (contains only present and feature subscription)
// Version: 1.0.0
// Modified: 

const { SUBSCRIPTION_STATUS_ENUM_VALUES, BILLING_CYCLE, UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const OrganizationSubscription = sequelize.define('OrganizationSubscription', {

    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: tablePrefix + 'organizations',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },


    snapshot_plan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: tablePrefix + 'plan_snapshots',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    plan_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: tablePrefix + 'plans',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    in_pause: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Indicates if the subscription is currently paused',
    },

    pause_days_left : {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of days left for pause. Snapshotted at activation time.',
    },

    trial_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of days this trial is valid for. Snapshotted at activation time.',
    },

    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    
    next_renewal_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    billing_cycle: {
      type: DataTypes.ENUM(BILLING_CYCLE),
      allowNull: false,
      defaultValue: 'monthly',
    },
    next_sub_id : {
      type: DataTypes.UUID,
      allowNull: true,
      comment : "subscription to continue after this subscription"
    },
    payment : {
      type: DataTypes.ENUM(["pending", "done", "failed"]),
      defaultValue: 'pending',
    },
    status: {
      type: DataTypes.ENUM(SUBSCRIPTION_STATUS_ENUM_VALUES),
      defaultValue: 'activate_pending',
    },

    ...commonFields(),
  }, {
    tableName: tablePrefix + 'organization_subscriptions',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
  });

  commonFields(OrganizationSubscription);

  OrganizationSubscription.associate = (models) => {
    OrganizationSubscription.belongsTo(models.Organization, {
      foreignKey: 'organization_id',
      as: 'organization',
    });

    OrganizationSubscription.belongsTo(models.PlanSnapshot, {
      foreignKey: 'snapshot_plan_id',
      as: 'plan',
    });

    OrganizationSubscription.belongsTo(models.Plan, {
      foreignKey: 'plan_id',
      as: 'orgninal_plan',
    });

  
    OrganizationSubscription.hasMany(models.Invoice, {
      foreignKey: 'subscription_id',
      as: 'invoices',
    });

    OrganizationSubscription.hasMany(models.SubscriptionPause, {
      foreignKey: 'subscription_id',
      as: 'pauses',
    });

    OrganizationSubscription.hasOne(models.OrganizationSubscription, {
      foreignKey: 'next_sub_id',
      as: 'next_subscription',
    });


  }; 

  return OrganizationSubscription;
};
