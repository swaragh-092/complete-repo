// models/user_metadata.js - FIXED VERSION (REMOVE CIRCULAR REFERENCE)

'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserMetadata extends Model {
    static associate(models) {
      // User belongs to primary organization (optional)
      UserMetadata.belongsTo(models.Organization, {
        foreignKey: 'org_id',
        targetKey: 'id',
        as: 'PrimaryOrganization'
      });

      // User has many organization memberships
      UserMetadata.hasMany(models.OrganizationMembership, {
        foreignKey: 'user_id',
        sourceKey: 'id',
        as: 'Memberships'
      });

      // Tenant mappings for multi-tenant clients
      UserMetadata.hasMany(models.TenantMapping, {
        foreignKey: 'user_id',
        sourceKey: 'keycloak_id' // TenantMapping uses keycloak_id
      });

      // Client requests approved by this user
      UserMetadata.hasMany(models.ClientRequest, {
        foreignKey: 'approved_by',
        as: 'ApprovedClientRequests'
      });

      UserMetadata.hasMany(models.FederatedIdentityMapping, {
        foreignKey: 'user_id',
        sourceKey: 'id',
        as: 'FederatedIdentities'
      });

      // ❌ REMOVED: This was causing circular reference errors
      // UserMetadata.belongsToMany(models.Organization, { through: models.OrganizationMembership, ... })
    }

    // Helper methods to get data via OrganizationMembership
    async getOrganizations() {
      const memberships = await this.getMemberships({
        include: [{ model: sequelize.models.Organization }]
      });
      return memberships.map(m => m.Organization);
    }

    async getUserPermissions() {
      const memberships = await this.getMemberships({
        include: [{
          model: sequelize.models.Role,
          include: [{
            model: sequelize.models.Permission,
            as: 'Permissions',
            through: { attributes: [] }
          }]
        }]
      });

      const permissions = new Set();
      memberships.forEach(membership => {
        if (membership.Role?.Permissions) {
          membership.Role.Permissions.forEach(perm => {
            permissions.add(perm.name);
          });
        }
      });

      return Array.from(permissions);
    }
  }

  UserMetadata.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    keycloak_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    org_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      },
      comment: 'Organization this user OWNS'
    },
    primary_org_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'organizations',
        key: 'id'
      },
      comment: 'Primary organization for single-org mode'
    },
    designation: {
      type: DataTypes.STRING(100),
      validate: {
        len: [0, 100]
      }
    },
    department: {
      type: DataTypes.STRING(100),
      validate: {
        len: [0, 100]
      }
    },
    avatar_url: {
      type: DataTypes.TEXT,
      validate: {
        isUrl: true
      }
    },
    mobile: {
      type: DataTypes.STRING(20),
      validate: {
        len: [0, 20]
      }
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    last_login_provider: {
      type: DataTypes.STRING(50),
      allowNull: true,
      // comment: 'Last used auth provider'
    },
    last_login_ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      // comment: 'Last login IP address'
    },
    last_login: {
      type: DataTypes.DATE,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'UserMetadata',
    tableName: 'user_metadata',
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    indexes: [
      { fields: ['keycloak_id'] },
      { fields: ['org_id'] },
      { fields: ['email'] },
      { fields: ['is_active'] }
    ],
    scopes: {
      active: {
        where: { is_active: true }
      }
    }
  });

  return UserMetadata;
};