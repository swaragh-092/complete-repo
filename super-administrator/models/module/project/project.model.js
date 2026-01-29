// Author : Gururaj
// Created: 31th July 2025
// Description: Project table
// Version: 1.0.0
// Modified: 

const { UNWANTED_FILEDS } = require("../../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const Project = sequelize.define('project', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    short_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    sub_domain: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    is_active : {
      type: DataTypes.BOOLEAN,
      defaultValue : false,
      allowNull: false
    },
    ...commonFields(),
  }, {
    tableName: tablePrefix + 'projects',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
  });

  commonFields(Project);

  Project.associate = (models) => {
    Project.hasMany(models.ModuleFeatureSnapshot, {
        foreignKey: 'project_id',
        as: 'versions',
    });

    Project.hasMany(models.PlanProject, {
        foreignKey: 'project_id',
        as: 'plan_projects',
    });
  };


  return Project;
};
