// models/ResourceAttribute.js - Resource Attribute Model for ABAC

'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ResourceAttribute extends Model {
    static associate(models) {
      // Attributes can be scoped to organization
      ResourceAttribute.belongsTo(models.Organization, {
        foreignKey: 'org_id',
        targetKey: 'id',
        as: 'Organization',
      });
    }
  }

  ResourceAttribute.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      resource_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Type of resource (project, document, task, etc.)',
      },
      resource_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'ID of the resource',
      },
      org_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Organization context',
      },
      attributes: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Resource attributes (classification, tags, metadata, etc.)',
      },
      classification: {
        type: DataTypes.ENUM('public', 'internal', 'confidential', 'restricted'),
        defaultValue: 'internal',
        // comment: 'Data classification level',
      },
      tags: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Resource tags for filtering',
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
      modelName: 'ResourceAttribute',
      tableName: 'resource_attributes',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['resource_type', 'resource_id'] },
        { fields: ['org_id'] },
        { fields: ['classification'] },
        {
          unique: true,
          fields: ['resource_type', 'resource_id'],
          name: 'resource_attribute_unique_idx',
        },
      ],
    }
  );

  return ResourceAttribute;
};








