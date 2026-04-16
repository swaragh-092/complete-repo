'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ClientRequest extends Model {
    static associate(models) {
      // Each ClientRequest may have been approved by one user
      ClientRequest.belongsTo(models.UserMetadata, {
        foreignKey: 'approved_by',
        as: 'approver',
      });
    }
  }

  ClientRequest.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      client_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      redirect_url: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      developer_email: {
        type: DataTypes.STRING(255),
      },
      developer_name: {
        type: DataTypes.STRING(255),
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
      },
      requested_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      approved_at: {
        type: DataTypes.DATE,
      },
      approved_by: {
        type: DataTypes.UUID,
        references: {
          model: 'user_metadata',
          key: 'id',
        },
      },
      rejection_reason: {
        type: DataTypes.TEXT,
      },
      requires_organization: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this client requires users to belong to an organization'
      },
      organization_model: {
        type: DataTypes.ENUM('single', 'multi', 'workspace', 'enterprise'),
        allowNull: true
        // Note: Comment removed to fix Sequelize sync bug with PostgreSQL ENUMs
      },
      organization_features: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Array of organization features this client will use'
      },
      onboarding_flow: {
        type: DataTypes.ENUM('create_org', 'invitation_only', 'domain_matching', 'flexible'),
        allowNull: true
        // Note: Comment removed to fix Sequelize sync bug with PostgreSQL ENUMs
      },

      metadata: {
        type: DataTypes.JSON,
      },
    },
    {
      sequelize,
      modelName: 'ClientRequest',
      tableName: 'client_requests',
      timestamps: false, // since requested_at and approved_at are manual
    }
  );

  return ClientRequest;
};
