// Author : Gururaj
// Created: 31th July 2025
// Description: This is global settings.
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const GlobalSetting = sequelize.define('GlobalSetting', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      // comment: 'E.g., trial_days, grace_period_days, max_user_limit',
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Stored as string, to be parsed to int/bool/etc. when fetched',
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Optional human-readable context for the key',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    ...commonFields(),
  }, {
    tableName: tablePrefix + 'global_settings',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
  });

  commonFields(GlobalSetting);

  GlobalSetting.associate = () => {
    // No associations needed (standalone key-value config)
  };

  return GlobalSetting;
};
