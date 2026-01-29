// Author : Gururaj
// Created: 31th July 2025
// Description: Organization subscription history module (contains only completed or failed subscription )
// Version: 1.0.0
// Modified: 

const {  SUBSCRIPTION_STATUS_ENUM_VALUES_FOR_HISTORY, UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const OrganizationSubscriptionCompleted = sequelize.define('OrganizationSubscriptionCompleted', {

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
      allowNull: false,
    },

    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    
    next_renewal_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment : "subscription to continue after this subscription"
    },

    status: {
      type: DataTypes.ENUM(SUBSCRIPTION_STATUS_ENUM_VALUES_FOR_HISTORY),
    },

    ...commonFields(),
  }, {
    tableName: tablePrefix + 'organization_subscriptions_completed',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
  });

  commonFields(OrganizationSubscriptionCompleted);

  OrganizationSubscriptionCompleted.associate = (models) => {
    OrganizationSubscriptionCompleted.belongsTo(models.Organization, {
      foreignKey: 'organization_id',
      as: 'organization',
    });

    OrganizationSubscriptionCompleted.belongsTo(models.PlanSnapshot, {
      foreignKey: 'snapshot_plan_id',
      as: 'plan',
    });

  
    OrganizationSubscriptionCompleted.hasMany(models.Invoice, {
      foreignKey: 'subscription_id',
      as: 'invoices',
    });

    OrganizationSubscriptionCompleted.hasMany(models.SubscriptionPause, {
      foreignKey: 'subscription_id',
      as: 'pauses',
    });


  }; 

  return OrganizationSubscriptionCompleted;
};
 