const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Organization extends Model {
    static associate(models) {
      Organization.hasMany(models.UserMetadata, {
        foreignKey: "org_id",
        sourceKey: "id",
      });
      Organization.hasMany(models.OrganizationMembership, {
        foreignKey: "org_id",
        sourceKey: "id",
      });
      Organization.hasMany(models.Invitation, {
        foreignKey: "org_id",
        sourceKey: "id",
      });
      Organization.hasMany(models.PendingInvitation, {
        foreignKey: "org_id",
        sourceKey: "id",
      });
    }

    generateTenantId() {
      // Generate unique tenant ID
      const baseId = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 20);
      const timestamp = Date.now().toString().slice(-6);
      return `${baseId}${timestamp}`;
    }
  }

  Organization.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      tenant_id: {
        type: DataTypes.STRING(50),
        unique: true,
      },
      description: {
        // ✅ ADD THIS FIELD
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Organization description",
      },
      status: {
        type: DataTypes.ENUM("pending", "active", "suspended", "inactive"),
        defaultValue: "active",
      },
      provisioned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Whether org was created by admin vs self-service",
      },
      settings: {
        type: DataTypes.JSON,
        defaultValue: {},
        comment: "Organization-specific settings",
      },
      allowed_providers: {
        type: DataTypes.JSON,
        defaultValue: ["google", "microsoft", "github", "keycloak"],
        comment: "Allowed identity providers for this org",
      },
      require_workspace_email: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Require users to sign up with workspace/business email",
      },
      email_domain_restriction: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Required email domain (e.g., @company.com)",
      },
      enforce_provider_domain: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Enforce workspace accounts (Google Workspace, not Gmail)",
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
      modelName: "Organization",
      tableName: "organizations",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["tenant_id"] },
        { fields: ["status"] },
        { fields: ["provisioned"] },
      ],
    }
  );

  return Organization;
};
