// Author : Gururaj
// Created: 30th July 2025
// Description: Organization subscription pause (this will contain currently running or pending pause).
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const SubscriptionPause = sequelize.define(
    "SubscriptionPause",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organization_id: { type: DataTypes.UUID, allowNull: false,
        references: {
          model: tablePrefix + 'organizations',
          key: 'id'
        },
        onDelete: 'CASCADE',
      },
      subscription_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: tablePrefix + 'organization_subscriptions',
          key: 'id'
        },
        onDelete: 'CASCADE',
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_DATE"),
        comment : "start date of the pause",

      },
      is_completed: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Indicates if the pause is currently active' },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Indicates if the pause is currently active' },
      end_date: { type: DataTypes.DATEONLY, allowNull: false,  comment : "end date of pause",},
      reason: { type: DataTypes.STRING },
      paused_by: { type: DataTypes.UUID },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "subscription_pauses",
      timestamps: true,
      underscored: true,
      defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
      paranoid: true,             
      deletedAt: 'deleted_at'
    }
  );

  commonFields(SubscriptionPause);

  SubscriptionPause.associate = (models) => {
    SubscriptionPause.belongsTo(models.Organization, {
      foreignKey: "organization_id",
      as: "organization",
    });
    SubscriptionPause.belongsTo(models.OrganizationSubscription, {
      foreignKey: "subscription_id",
      as: "subscription",
    });
  };

  return SubscriptionPause;
};
