// Author : Gururaj
// Created: 30th July 2025
// Description: Module feature table model
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
const ModuleMaxVersion = sequelize.define('ModuleMaxVersion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    module_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: tablePrefix + "module_registry",
        key: 'id',
      },
      onDelete: 'CASCADE',
      unique: 'unique_module_code'
    },
    max_version : {
        type: DataTypes.INTEGER,
        allowNull:false,
        defaultValue: 1
    },
  }, {
    tableName: tablePrefix + 'module_max_version',
    underscored: true,
    timestamps: true,
  });


  return ModuleMaxVersion;
}