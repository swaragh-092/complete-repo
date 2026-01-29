'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ClientPolicy extends Model {
    static associate(models) {
      ClientPolicy.belongsTo(models.Client, {
        foreignKey: 'client_id',
        targetKey: 'id',
        as: 'Client'
      });
    }
  }

  ClientPolicy.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
      },
      // enable/disable RBAC, ReBAC, ABAC
      use_rbac: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // most apps use roles
      },
      use_rebac: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      use_abac: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      // optional: JSON for advanced ABAC rules (key-value conditions)
      abac_rules: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
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
      modelName: 'ClientPolicy',
      tableName: 'client_policies',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['client_id'] }],
    }
  );

  return ClientPolicy;
};
