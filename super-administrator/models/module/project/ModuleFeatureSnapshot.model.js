// Author : Gururaj
// Created: 31th July 2025
// Description: Module feature snapshot model (it like reference table and acts like middle man of snapshot so that this id will be used every where)
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const ModuleFeatureSnapshot = sequelize.define('ModuleFeatureSnapshot', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id : {
      type : DataTypes.UUID,
      allowNull : false,
    },
    version: {
      type: DataTypes.DECIMAL(10, 2), 
      allowNull : false,
    },
    is_used : {
      type: DataTypes.BOOLEAN, 
      allowNull : false,
      defaultValue: false,
      comment : "This tells this snapshot is used for any subscription.",
    },
    ...commonFields(),
  }, {
    tableName: tablePrefix + 'module_feature_snapshot',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
  });

  commonFields(ModuleFeatureSnapshot);

  ModuleFeatureSnapshot.associate = (models) => {
    ModuleFeatureSnapshot.hasMany(models.SnapshotModule, {
      foreignKey: 'module_feature_snapshot_id',
      as: 'snapshot_modules',
    });
    ModuleFeatureSnapshot.belongsTo(models.Project, {
      foreignKey: 'project_id',
      as: 'project',
    });
    ModuleFeatureSnapshot.hasMany(models.PlanProject, {
        foreignKey: 'version_id',
        as: 'plan_projects',
    });
  };
  return ModuleFeatureSnapshot;
};
