// models/Policy.js - ABAC Policy Model

'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Policy extends Model {
    static associate(models) {
      // Policy can be scoped to organization
      Policy.belongsTo(models.Organization, {
        foreignKey: 'org_id',
        targetKey: 'id',
        as: 'Organization',
      });

      // Policy can be scoped to client
      Policy.belongsTo(models.Client, {
        foreignKey: 'client_id',
        targetKey: 'client_id',
        as: 'Client',
      });
    }
  }

  Policy.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Policy name/identifier',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      org_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Organization scope (null = global)',
      },
      client_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Client scope (null = all clients)',
      },
      effect: {
        type: DataTypes.ENUM('allow', 'deny'),
        allowNull: false,
        defaultValue: 'allow',
        // comment: 'Policy effect', // Removed to fix sync error
      },
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Higher priority policies are evaluated first',
      },
      // ABAC Conditions (JSON)
      conditions: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'ABAC conditions (subject, resource, environment attributes)',
      },
      // Target resources
      resources: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Resource patterns this policy applies to',
      },
      // Allowed actions
      actions: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Actions this policy allows/denies',
      },
      // Subject attributes (who this applies to)
      subjects: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Subject attribute conditions',
      },
      // Environment attributes (when/where this applies)
      environment: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Environment conditions (time, IP, etc.)',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_system: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'System policies cannot be deleted',
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Policy',
      tableName: 'policies',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['org_id'] },
        { fields: ['client_id'] },
        { fields: ['is_active'] },
        { fields: ['priority'] },
        { fields: ['effect'] },
      ],
    }
  );

  return Policy;
};








