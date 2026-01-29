// Author : Gururaj
// Created: 30th July 2025
// Description: Notification settings table for organization resource usage.
// Version: 1.0.0
// Modified: 

const { USAGE_NOTIFICATION_CATEGORY_ENUM_VALUES, UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const UsageNotificationSetting = sequelize.define('UsageNotificationSetting', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    category: DataTypes.ENUM(USAGE_NOTIFICATION_CATEGORY_ENUM_VALUES),
    threshold_percent: DataTypes.INTEGER,
    enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    ...commonFields()
  }, {
    tableName: tablePrefix + 'usage_notification_settings',
    timestamps: true,
    underscored: true,
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
  });

  commonFields(UsageNotificationSetting);

  return UsageNotificationSetting;
}
