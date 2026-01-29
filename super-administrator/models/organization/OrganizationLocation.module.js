// Author : Gururaj
// Created: 30th July 2025
// Description: Organization location model
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {

  const OrganizationLocation = sequelize.define('OrganizationLocation', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    organization_id: { 
      type: DataTypes.UUID, 
      allowNull: false, 
      unique: true,
      references: {
        model: tablePrefix + 'organizations',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    country: DataTypes.STRING,
    state: DataTypes.STRING,
    district: DataTypes.STRING,
    city: DataTypes.STRING,
    pincode: DataTypes.STRING,
    street: DataTypes.STRING,
    address: DataTypes.STRING,
    locale: { // example :  IN, US, De, Au ...
        type: DataTypes.STRING,
        comment : "ex : IN, US, De, Au..."
    },
    timezone: DataTypes.STRING,
    lat: DataTypes.DECIMAL(10, 6),
    lng: DataTypes.DECIMAL(10, 6),
    ...commonFields()
  }, {
    tableName: tablePrefix + 'organization_locations',
    timestamps: true,
    underscored: true,
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
  });

  commonFields(OrganizationLocation);

    OrganizationLocation.associate = (models)=> {
        OrganizationLocation.belongsTo(models.Organization, {
            foreignKey: 'organization_id',
            as: "organization",
        });       
    }
    return OrganizationLocation;
}
