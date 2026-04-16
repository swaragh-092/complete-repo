'use strict';
const { Model, DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  class RefreshToken extends Model {
    static associate(models) {
      RefreshToken.belongsTo(models.Client, { 
        foreignKey: 'client_id', 
        targetKey: 'client_id' 
      });
    }

    /**
     * Hash a refresh token for secure storage
     */
    static hashToken(token) {
      return crypto.createHash('sha256').update(token).digest('hex');
    }

    /**
     * Check if token is active (not revoked and not expired)
     */
    isActive() {
      return !this.revoked_at && new Date() < this.expires_at;
    }

    /**
     * Revoke this token
     */
    async revoke(reason = 'manual') {
      this.revoked_at = new Date();
      this.revoked_reason = reason;
      await this.save();
    }
  }

  RefreshToken.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      client_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      token_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      realm_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      session_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      device_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      revoked_reason: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      rotated_from: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
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
      modelName: 'RefreshToken',
      tableName: 'refresh_tokens',
      timestamps: true,
      updatedAt: 'updated_at',
      createdAt: 'created_at',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['client_id'] },
        { fields: ['token_hash'], unique: true },
        { fields: ['realm_name'] },
        { fields: ['expires_at'] },
        { fields: ['revoked_at'] },
        { fields: ['user_id', 'client_id', 'revoked_at'] },
        { fields: ['device_id'] },
      ],
    }
  );

  return RefreshToken;
};







