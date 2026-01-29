// models/Relationship.js - ReBAC Relationship Model

'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Relationship extends Model {
    static associate(models) {
      // Relationship source (user, org, resource)
      // Relationships are stored as generic entity references
    }
  }

  Relationship.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      source_type: {
        type: DataTypes.ENUM('user', 'organization', 'resource', 'role', 'group'),
        allowNull: false,
        // comment: 'Type of source entity', // Removed to fix sync error
      },
      source_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'ID of source entity',
      },
      relation_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Type of relationship (owner, member, manager, parent, child, etc.)',
      },
      target_type: {
        type: DataTypes.ENUM('user', 'organization', 'resource', 'role', 'group'),
        allowNull: false,
        // comment: 'Type of target entity', // Removed to fix sync error
      },
      target_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'ID of target entity',
      },
      org_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Organization context',
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Additional relationship metadata',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
      modelName: 'Relationship',
      tableName: 'relationships',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['source_type', 'source_id'] },
        { fields: ['target_type', 'target_id'] },
        { fields: ['relation_type'] },
        { fields: ['org_id'] },
        { fields: ['is_active'] },
        // Composite index for common queries
        {
          unique: false,
          fields: ['source_type', 'source_id', 'relation_type', 'target_type', 'target_id'],
          name: 'relationship_unique_idx',
        },
      ],
    }
  );

  return Relationship;
};








