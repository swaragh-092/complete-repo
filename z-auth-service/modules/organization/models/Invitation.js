'use strict';
const { Model, DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  class Invitation extends Model {
    static associate(models) {
      Invitation.belongsTo(models.Organization, {
        foreignKey: 'org_id',
        targetKey: 'id'
      });
      Invitation.belongsTo(models.Role, {
        foreignKey: 'role_id',
        targetKey: 'id'
      });
      Invitation.belongsTo(models.UserMetadata, {
        foreignKey: 'invited_by',
        targetKey: 'id',
        as: 'Inviter'
      });
      Invitation.belongsTo(models.UserMetadata, {
        foreignKey: 'accepted_by',
        targetKey: 'id',
        as: 'Accepter'
      });
    }

    // Generate invitation code
    static generateCode() {
      return crypto.randomBytes(32).toString('hex');
    }

    // Hash invitation code
    static hashCode(code) {
      return crypto.createHash('sha256').update(code).digest('hex');
    }

    // Verify invitation code
    verifyCode(code) {
      const hash = Invitation.hashCode(code);
      return this.code_hash === hash;
    }

    isExpired() {
      return new Date() > this.expires_at;
    }

    isAccepted() {
      return !!this.accepted_by;
    }
  }

  Invitation.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'organizations', key: 'id' }
    },
    invited_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { isEmail: true }
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'roles', key: 'id' }
    },
    code_hash: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    invited_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'user_metadata', key: 'id' }
    },
    accepted_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'user_metadata', key: 'id' }
    },
    accepted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'expired', 'revoked'),
      defaultValue: 'pending'
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
    modelName: 'Invitation',
    tableName: 'invitations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['org_id'] },
      { fields: ['invited_email'] },
      { fields: ['code_hash'] },
      { fields: ['status'] },
      { fields: ['expires_at'] }
    ]
  });

  return Invitation;
};