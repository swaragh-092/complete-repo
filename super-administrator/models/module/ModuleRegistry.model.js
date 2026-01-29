// Author : Gururaj
// Created: 30th July 2025
// Description: Module model
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const ModuleRegistry = sequelize.define(
    "ModuleRegistry",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'module code used for internal logic like permission checks',
        unique: 'unique_module_code'
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'User-friendly name of the module',
      },
      description: { 
        type: DataTypes.TEXT 
      },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      ...commonFields(),
    },
    {
      tableName: tablePrefix + "module_registry",
      timestamps: true,
      underscored: true,
      paranoid: true,              // <-- Enables soft delete
      deletedAt: 'deleted_at',
      defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
    }
  );
  commonFields(ModuleRegistry);

  ModuleRegistry.associate = (models) => {


    ModuleRegistry.hasMany(models.Codebase, {
        foreignKey: 'module_id',
        as: "codebase"
    });
    
    ModuleRegistry.hasMany(models.ModuleVersion, {
        foreignKey: 'module_id',
        as: "versions"
    });



  };

  return ModuleRegistry;
};
