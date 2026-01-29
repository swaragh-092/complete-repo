// Author : Gururaj
// Created: 31th July 2025
// Description: Plan moduel 
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../util/constant");


module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const PlanProject = sequelize.define('PlanProject', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id : {
      type: DataTypes.UUID,
      allowNull : false
    },
    plan_id : {
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
    tableName: tablePrefix + 'plan_project_map',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
    unique : ["plan_id", "project_id"],
  });

  commonFields(PlanProject);

  PlanProject.associate = (models) => {
    PlanProject.belongsTo(models.Plan, {
        foreignKey: 'plan_id',
        as: 'plan',
    });
    PlanProject.belongsTo(models.Project, {
        foreignKey: 'project_id',
        as: 'project',
    });
    PlanProject.belongsTo(models.ModuleFeatureSnapshot, {
        foreignKey: 'version_id',
        as: 'version',
    });
  };

  return PlanProject;
};
