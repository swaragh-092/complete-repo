// Author : Gururaj
// Created: 31th July 2025
// Description: Organization email module.
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const EmailPackage = sequelize.define(
    "EmailPackage",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organization_id: { type: DataTypes.UUID, allowNull: false },
      provider: DataTypes.STRING,
      smtp_user: DataTypes.STRING,
      smtp_host: DataTypes.STRING,
      use_default_price : {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment : "if this is true then the price will use which is in default or uses price per email defined here"
      },
      price_per_email: DataTypes.DECIMAL(10, 4),
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "email_packages",
      timestamps: true,
      underscored: true,
      defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
    }
  );

  commonFields(EmailPackage);

  EmailPackage.associate = (models) => {
    EmailPackage.belongsTo(models.Organization, {
      foreignKey: "organization_id",
      as: "organization",
    });
  };

  return EmailPackage;
};
