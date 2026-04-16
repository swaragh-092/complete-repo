'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Client extends Model {
    static associate(models) {
      Client.hasMany(models.TenantMapping, { foreignKey: 'client_key', sourceKey: 'client_key' });
      Client.hasMany(models.AuditLog, { foreignKey: 'client_id', sourceKey: 'client_id' });
      Client.belongsTo(models.Realm, { foreignKey: 'realm_id', targetKey: 'id' });
      Client.hasOne(models.ClientPolicy, {
        foreignKey: 'client_id',
        as: 'Policy'
      });
    }
  }

  Client.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      client_key: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      realm_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      client_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      client_secret: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      callback_url: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      requires_tenant: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      requires_organization: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this client requires organization context for users'
      },
      organization_model: {
        type: DataTypes.ENUM('single', 'multi', 'workspace', 'enterprise'),
        allowNull: true
        // Note: Comment removed to fix Sequelize sync bug with PostgreSQL ENUMs
      },
      onboarding_flow: {
        type: DataTypes.ENUM('create_org', 'invitation_only', 'domain_matching', 'flexible'),
        allowNull: true

      },
      organization_features: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Features enabled for organizations in this client'
      },
      allow_primary_org_change: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'If true, users can request to change their primary organization'
      },
      // ✅ UI Metadata
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      icon: {
        type: DataTypes.STRING(255),
        defaultValue: '🔗',
      },
      primary_color: {
        type: DataTypes.STRING(20),
        defaultValue: '#3B82F6',
      },
      display_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Human readable name overriding client_key'
      },
      redirect_url: {
        type: DataTypes.STRING,
        allowNull: true, // or false depending on your constraints
      },
      tenant_id: {
        type: DataTypes.STRING(50),
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'Client',
      tableName: 'clients',
      timestamps: false,
      indexes: [
        { fields: ['client_key'] },
        { fields: ['realm_id'] },
        { fields: ['tenant_id'] },
      ],
    }
  );

  return Client;
};