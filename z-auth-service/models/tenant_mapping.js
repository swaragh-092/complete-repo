'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class TenantMapping extends Model {
    static associate(models) {
      // Link to Client by client_key
      TenantMapping.belongsTo(models.Client, {
        foreignKey: 'client_key',
        targetKey: 'client_key',
        as: 'Client'
      });

      // Link to Organization
      TenantMapping.belongsTo(models.Organization, {
        foreignKey: 'org_id',
        targetKey: 'id',
        as: 'Organization'
      });

      // Link to UserMetadata (optional, if you want local linkage)
      TenantMapping.belongsTo(models.UserMetadata, {
        foreignKey: 'user_id',
        targetKey: 'id',
        as: 'User'
      });
    }
  }

  TenantMapping.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_keycloak_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      org_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      tenant_slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      client_key: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'TenantMapping',
      tableName: 'tenant_mappings',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['user_keycloak_id', 'org_id', 'client_key'],
        },
      ],
    }
  );

  return TenantMapping;
};
