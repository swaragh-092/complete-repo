'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RolePermission extends Model {}

  RolePermission.init(
    {
      role_id: { type: DataTypes.UUID, references: { model: 'roles', key: 'id' } },
      permission_id: { type: DataTypes.UUID, references: { model: 'permissions', key: 'id' } },
    },
    { sequelize, modelName: 'RolePermission', tableName: 'role_permissions', timestamps: false }
  );

  return RolePermission;
};
