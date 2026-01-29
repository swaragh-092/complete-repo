// Author : Gururaj
// Created: 31th July 2025
// Description: Plan project for plan snapshot 
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const PlanProjectSnapshot = sequelize.define('PlanProjectSnapshot', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id : {
      type: DataTypes.UUID,
      allowNull : false
    },
    plan_snapshot_id : {
      type: DataTypes.UUID,
      allowNull : false
    },
    version_id : {
      type: DataTypes.UUID,
      allowNull : false,
      comment : "Module feature snapshot id"
    },
    ...commonFields(),
  }, {
    tableName: tablePrefix + 'plan_project_snapshot_map',
    underscored: true,
    timestamps: true,
    constraints: false,
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
  });

  commonFields(PlanProjectSnapshot);

  PlanProjectSnapshot.associate = (models) => {
    PlanProjectSnapshot.belongsTo(models.PlanSnapshot, {
        foreignKey: 'plan_snapshot_id',
        as: 'plan',
    });
    PlanProjectSnapshot.belongsTo(models.Project, {
        foreignKey: 'project_id',
        as: 'project',
    });
    PlanProjectSnapshot.belongsTo(models.ModuleFeatureSnapshot, {
        foreignKey: 'version_id',
        as: 'version',
    });
  };

  return PlanProjectSnapshot;
};
