// Author : Gururaj
// Created: 31th July 2025
// Description: Organization usage limit and usage table
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");

const OrganizationUsageLimits = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const OrganizationUsageLimits = sequelize.define(
    "OrganizationUsageLimits",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organization_id: { type: DataTypes.UUID, allowNull: false },
      user_count: { type: DataTypes.INTEGER, defaultValue: 0 },
      user_limit: { type: DataTypes.INTEGER, defaultValue: 10 },
      storage_usage_mb: { type: DataTypes.INTEGER, defaultValue: 0 },
      storage_limit_mb: { type: DataTypes.INTEGER, defaultValue: 10240 },
      db_usage_mb: { type: DataTypes.INTEGER, defaultValue: 0 },
      db_limit_mb: { type: DataTypes.INTEGER, defaultValue: 1024 },
      from_data: { type: DataTypes.DATEONLY, allowNull: false },
      sms_usage: { type: DataTypes.INTEGER, defaultValue: 0 },
      sms_limit: { type: DataTypes.INTEGER, defaultValue: 500 },
      total_sms_usage: { type: DataTypes.INTEGER, defaultValue: 0 },
      email_usage: { type: DataTypes.INTEGER, defaultValue: 0 },
      email_limit: { type: DataTypes.INTEGER, defaultValue: 1000 },
      total_email_usage: { type: DataTypes.INTEGER, defaultValue: 0 },
      api_requests: { type: DataTypes.INTEGER, defaultValue: 0 },
      api_requests_limit: { type: DataTypes.INTEGER, defaultValue: 1000 },
      total_api_requests: { type: DataTypes.INTEGER, defaultValue: 0 },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "organization_usage_limits",
      timestamps: true,
      underscored: true,
      defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
    }
  );

  commonFields(OrganizationUsageLimits);

  OrganizationUsageLimits.associate = (models) => {
    OrganizationUsageLimits.belongsTo(models.Organization, {
      foreignKey: "organization_id",
      as: "organization",
    });
  };

  return OrganizationUsageLimits;
};

const OrganizationUsageHistory = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const OrganizationUsageHistory = sequelize.define(
    "OrganizationUsageHistory",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organization_id: { type: DataTypes.UUID, allowNull: false },
      from_date: { type: DataTypes.DATEONLY, allowNull: false },

      to_date: { type: DataTypes.DATEONLY, allowNull: false },

      user_count: { type: DataTypes.INTEGER, defaultValue: 0 },
      user_limit: { type: DataTypes.INTEGER, defaultValue: 10 },

      storage_usage_mb: { type: DataTypes.INTEGER, defaultValue: 0 },
      storage_limit_mb: { type: DataTypes.INTEGER, defaultValue: 10240 },

      db_usage_mb: { type: DataTypes.INTEGER, defaultValue: 0 },
      db_limit_mb: { type: DataTypes.INTEGER, defaultValue: 1024 },

      sms_usage: { type: DataTypes.INTEGER, defaultValue: 0 },
      sms_limit: { type: DataTypes.INTEGER, defaultValue: 500 },
      total_sms_usage: { type: DataTypes.INTEGER, defaultValue: 0 },

      email_usage: { type: DataTypes.INTEGER, defaultValue: 0 },
      email_limit: { type: DataTypes.INTEGER, defaultValue: 1000 },
      total_email_usage: { type: DataTypes.INTEGER, defaultValue: 0 },

      api_requests: { type: DataTypes.INTEGER, defaultValue: 0 },
      api_requests_limit: { type: DataTypes.INTEGER, defaultValue: 1000 },
      total_api_requests: { type: DataTypes.INTEGER, defaultValue: 0 },

      ...commonFields(),
    },
    {
      tableName: tablePrefix + "organization_usage_history",
      timestamps: true,
      underscored: true,
    }
  );

  commonFields(OrganizationUsageHistory);

  OrganizationUsageHistory.associate = (models) => {
    OrganizationUsageHistory.belongsTo(models.Organization, {
      foreignKey: "organization_id",
      as: "organization",
    });
  };

  return OrganizationUsageHistory;
};

module.exports = { default : OrganizationUsageLimits, OrganizationUsageHistory}
