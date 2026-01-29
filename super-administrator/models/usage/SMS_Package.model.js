// Author : Gururaj
// Created: 31th July 2025
// Description: Organization sms module.
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const SMSPackage = sequelize.define(
    "SMSPackage",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organization_id: { type: DataTypes.UUID, allowNull: false },
      provider: DataTypes.STRING,
      sms_key: DataTypes.STRING,
      sms_sender_id: DataTypes.STRING,
      use_default_price : {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      price_per_sms: DataTypes.DECIMAL(10, 4),
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "sms_packages",
      timestamps: true,
      underscored: true,
      defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
    }
  );

  commonFields(SMSPackage);

  SMSPackage.associate = (models) => {
    SMSPackage.belongsTo(models.Organization, {
      foreignKey: "organization_id",
      as: "organization",
    });
  };

  return SMSPackage;
};
