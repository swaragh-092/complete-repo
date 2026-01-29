'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class OrganizationMembership extends Model {
    static associate(models) {
      OrganizationMembership.belongsTo(models.UserMetadata, {
        foreignKey: 'user_id',
        targetKey: 'id',
        as: 'UserMetadata' // Explicit alias mandated by routes
      });
      OrganizationMembership.belongsTo(models.Organization, {
        foreignKey: 'org_id',
        targetKey: 'id',
        as: 'Organization' // Explicit alias mandated by routes
      });
      OrganizationMembership.belongsTo(models.Role, {
        foreignKey: 'role_id',
        targetKey: 'id',
        as: 'Role' // Explicit alias mandated by routes
      });
    }
  }

  OrganizationMembership.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      org_id: { type: DataTypes.UUID, allowNull: false },
      role_id: { type: DataTypes.UUID, allowNull: false },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'pending'),
        // defaultValue: 'active' // Commented out to fix type casting error 
      },
      // Add unique constraint to prevent duplicate memberships
      //   UNIQUE: { fields: ['user_id', 'org_id', 'role_id'] },
    },
    {
      sequelize, modelName: 'OrganizationMembership', tableName: 'organization_memberships', timestamps: false, indexes: [
        {
          unique: true,
          fields: ['user_id', 'org_id', 'role_id'],
        },
      ]
    }
  );



  return OrganizationMembership;
};
