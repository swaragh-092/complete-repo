// Author : Gururaj
// Created: 30th July 2025
// Description: Module model
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const ModuleVersion = sequelize.define(
    "ModuleVersion",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      module_id : {
        type: DataTypes.UUID,
        allowNull: false
      },
      description: { 
        type: DataTypes.TEXT 
      },
      docker_container: { 
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      port: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,       
          max: 65535   
        },
      },

      version: {
        type: DataTypes.DECIMAL(5, 2), 
        allowNull: false,
      },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "module_versions",
      timestamps: true,
      underscored: true,
      defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
    }
  );
  commonFields(ModuleVersion);

  ModuleVersion.associate = (models) => {
    ModuleVersion.belongsTo(models.ModuleRegistry, {
        foreignKey: 'module_id',
        as: "module"
    });
    ModuleVersion.belongsTo(models.ModuleRegistry, {
        foreignKey: 'module_id',
        as: "base_module"
    });

    ModuleVersion.hasMany(models.Database, {
        foreignKey: 'module_version_id',
        as: "database"
    });
  };

  return ModuleVersion;
};