// models/Roles.js - SIMPLIFIED FOR database.js

'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Role extends Model {
    static associate(models) {
      // Simple many-to-many with permissions
      Role.belongsToMany(models.Permission, {
        through: 'RolePermission',
        foreignKey: 'role_id',
        otherKey: 'permission_id',
        as: 'Permissions'
      });

      // Used in organization memberships
      Role.hasMany(models.OrganizationMembership, {
        foreignKey: 'role_id',
        sourceKey: 'id'
      });

      // REMOVE these complex associations that cause circular references:
      // - Role.belongsToMany(models.UserMetadata, ...)
      // - Role.belongsToMany(models.Organization, ...)
    }
  }

  Role.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
      validate: {
        len: [1, 100],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_system: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['name'] },
      { fields: ['is_system'] }
    ]
  });

  return Role;
};