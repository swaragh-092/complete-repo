// Author : Gururaj
// Created: 31th July 2025
// Description: plan snapshot model (This is main plan which links for subscription and this is snapshot of the plan so that the changes shoudl not reflect on the subscription)
// Version: 1.0.0
// Modified: 

const {BILLING_CYCLE, PLAN_TYPE, UNWANTED_FILEDS} = require("../../util/constant");

module.exports = (sequelize, DataTypes, tablePrefix, commonFields) => {
  const PlanSnapshot = sequelize.define('PlanSnapshot', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    plan_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(PLAN_TYPE),
      allowNull: false,
      // comment: `individual for per module plan, bundle for multi module plan`,
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
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    is_used : {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    ...commonFields(),
  }, {
    tableName: tablePrefix + 'plan_snapshots',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: {
          exclude: UNWANTED_FILEDS
        },
      },
  });

  commonFields(PlanSnapshot);

  PlanSnapshot.associate = (models) => {

    PlanSnapshot.belongsTo(models.Plan, {
      foreignKey: 'plan_id',
      as: 'plan',
    });

    PlanSnapshot.hasMany(models.OrganizationSubscription, {
      foreignKey: 'snapshot_plan_id',
      as: 'subscriptions',
    });
    // PlanSnapshot.belongsToMany(models.Project, {
    //   through: models.PlanProjectSnapshot,
    //   foreignKey: 'plan_id',
    //   otherKey: 'project_id',
    //   as: 'projects',
    // });

    PlanSnapshot.hasMany(models.PlanProjectSnapshot, {
      foreignKey: 'plan_snapshot_id',
      as: 'plan_projects_snapshot',
    });

  };

  return PlanSnapshot;
};
