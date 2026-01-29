// Author : Gururaj
// Created: 31th July 2025
// Description: Plan moduel 
// Version: 1.0.0
// Modified: 

const {BILLING_CYCLE, PLAN_TYPE, UNWANTED_FILEDS} = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const Plan = sequelize.define('Plan', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(PLAN_TYPE),
      allowNull: false,
      // comment: `individual for per-module plan, bundle for multi-module plan`,
    },
    billing_cycle: {
      type: DataTypes.ENUM(BILLING_CYCLE),
      allowNull: false,
      defaultValue: 'monthly',
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    allow_trial: { 
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    pause_days: { 
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of days a subscription can be paused',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    recent_snapshot_id : {
      type: DataTypes.UUID,
      allowNull : true,

    },
    ...commonFields(),
  }, {
    tableName: tablePrefix + 'plans',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
    paranoid: true,              // <-- Enables soft delete
    deletedAt: 'deleted_at'
  });

  commonFields(Plan);

  Plan.associate = (models) => {
    Plan.hasMany(models.PlanSnapshot, {
      foreignKey: 'plan_id',
      as: 'snapshots',
    });

    Plan.belongsTo(models.PlanSnapshot, {
      foreignKey: 'recent_snapshot_id',
      as: 'recent_snapshot',
    });

    Plan.belongsToMany(models.Project, {
      through: models.PlanProject,
      foreignKey: 'plan_id',
      otherKey: 'project_id',
      as: 'projects',
    });

    Plan.hasMany(models.PlanProject, {
      foreignKey: 'plan_id',
      as: 'plan_projects',
    });

  };

  return Plan;
};
