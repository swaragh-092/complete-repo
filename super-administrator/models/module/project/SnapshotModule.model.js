// Author : Gururaj
// Created: 31th July 2025
// Description: snapshot of modules for moduleFeatureSnapshot table
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const SnapshotModule = sequelize.define('SnapshotModule', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    module_feature_snapshot_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    module_version_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    ...commonFields(),
  }, {
    tableName: tablePrefix + 'snapshot_modules',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS,
          include: ['module_feature_snapshot_id','module_version_id']
        
        },
      },
  }); 

  commonFields(SnapshotModule);

  SnapshotModule.associate = (models) => {
    SnapshotModule.belongsTo(models.ModuleFeatureSnapshot, {
      foreignKey: 'module_feature_snapshot_id',
      as: 'module_feature_snapshot',
    });
  SnapshotModule.belongsTo(models.ModuleVersion, {
      foreignKey: 'module_version_id',
      as: 'module_version',
    });
    SnapshotModule.hasMany(models.SnapshotModuleFeature, {
      foreignKey: 'snapshot_module_id',
      as: 'snapshot_module_features',
    });
  };

  return SnapshotModule;
};
