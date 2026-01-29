// Author : Gururaj
// Created: 31th July 2025
// Description: moduleFeatureSnapshot -> moduleSnapshot -> "featureSnapshot".
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const SnapshotModuleFeature = sequelize.define('SnapshotModuleFeature', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    snapshot_module_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    feature_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    ...commonFields(),
  }, {
    tableName: tablePrefix + 'snapshot_module_features',
    underscored: true,
    timestamps: true,    
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
  });

  commonFields(SnapshotModuleFeature);

  SnapshotModuleFeature.associate = (models) => {
    
    SnapshotModuleFeature.belongsTo(models.SnapshotModule, {
      foreignKey: 'snapshot_module_id',
      as: 'snapshot_module',
    });

    SnapshotModuleFeature.belongsTo(models.ModuleFeature, {
      foreignKey: 'feature_id',
      as: 'feature',
    });
    
  };  

  return SnapshotModuleFeature;
};
