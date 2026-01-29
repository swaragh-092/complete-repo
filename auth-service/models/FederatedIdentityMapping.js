// models/FederatedIdentityMapping.js
'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class FederatedIdentityMapping extends Model {
    static associate(models) {
      // Belongs to UserMetadata
      FederatedIdentityMapping.belongsTo(models.UserMetadata, {
        foreignKey: 'user_id',
        targetKey: 'id',
        as: 'User'
      });
    }
  }

  FederatedIdentityMapping.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'user_metadata',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Identity provider: google, microsoft, github, keycloak'
    },
    provider_user_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Provider\'s unique user ID'
    },
    provider_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Email from provider'
    },
    linked_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Additional provider-specific data'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'FederatedIdentityMapping',
    tableName: 'federated_identity_mapping',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['provider', 'provider_user_id'] },
      { fields: ['user_id'] },
      { fields: ['provider'] },
      { fields: ['provider_email'] }
    ]
  });

  return FederatedIdentityMapping;
};
