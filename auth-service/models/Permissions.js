// models/Permissions.js - UPDATED FOR NEW SCHEMA
'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Permission extends Model {
    static associate(models) {
      // Permission belongs to many roles (many-to-many)
      Permission.belongsToMany(models.Role, {
        through: 'RolePermission',
        foreignKey: 'permission_id',
        otherKey: 'role_id',
        as: 'Roles' // Add alias for cleaner queries
      });


    }
  }

  Permission.init({
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
        notEmpty: true,
        // Validate permission format: "client:resource:action" or "client:resource:sub:action"
        is: /^[a-z_*]+:[a-z_]+:[a-z_]+(:[a-z_]+)?$/i
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Resource this permission applies to (e.g., project, user, org)'
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Action this permission allows (e.g., create, read, update, delete)'
    },
    is_system: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'System permissions cannot be deleted'
    },
    client_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Client/App scope (NULL = global permission)',
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
    modelName: 'Permission',
    tableName: 'permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['name'] },
      { fields: ['resource'] },
      { fields: ['action'] },
      { fields: ['is_system'] }
    ],
    hooks: {
      beforeValidate: (permission) => {
        // Auto-populate resource and action from name if they follow format
        if (permission.name && !permission.resource && !permission.action) {
          const parts = permission.name.split(':');
          if (parts.length === 2) {
            permission.resource = parts[0];
            permission.action = parts[1];
          }
        }
      }
    }
  });

  return Permission;
};