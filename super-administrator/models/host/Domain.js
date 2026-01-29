// Author : Gururaj
// Created: 31th July 2025
// Description: Organization domain maintain model
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const Domain = sequelize.define(
    "DNSMapping",
    {
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
          key: 'id'
        },
        onDelete: 'CASCADE',
      },
      sub_domain: { type: DataTypes.STRING, unique: true, allowNull: false },
      ip_address: { type: DataTypes.STRING },
      verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      dns_provider: { type: DataTypes.STRING },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "dns_mappings",
      timestamps: true,
      underscored: true,
      defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
    }
  );

  commonFields(Domain);

  Domain.associate = (models) => {
    Domain.belongsTo(models.Organization, {
      foreignKey: "organization_id",
      as: "organization",
    });
  };

  return Domain;
};
