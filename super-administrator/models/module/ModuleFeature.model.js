// Author : Gururaj
// Created: 30th July 2025
// Description: Module feature table model
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
const ModuleFeature = sequelize.define('ModuleFeature', {
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
    },
    module_version_id : {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: tablePrefix + "module_versions",
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    code: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Feature code used for internal logic like permission checks',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'User-friendly name of the feature',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    ...commonFields(),
  }, {
    tableName: tablePrefix + 'module_features',
    underscored: true,
    timestamps: true,
    paranoid: true,
    deletedAt: 'deleted_at',
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
  });

  commonFields(ModuleFeature);

  // Associations
  ModuleFeature.associate = (models) => {
    ModuleFeature.belongsTo(models.ModuleRegistry, {
      foreignKey: 'module_id',
      as: 'module',
    });
    ModuleFeature.belongsTo(models.ModuleVersion, {
      foreignKey: 'module_version_id',
      as: 'module_version',
    });    

  };

  return ModuleFeature;
}