// services/relationship-graph.service.js - ReBAC Relationship Graph Service

const { Relationship, Organization, OrganizationMembership, Role, Sequelize } = require('../config/database');
const { Op } = Sequelize;

class RelationshipGraph {
  /**
   * Check if a relationship exists
   * @param {Object} params
   * @param {string} params.sourceType - Type of source entity
   * @param {string} params.sourceId - ID of source entity
   * @param {string} params.relationType - Type of relationship
   * @param {string} params.targetType - Type of target entity
   * @param {string} params.targetId - ID of target entity
   * @param {string} [params.orgId] - Organization context
   * @returns {boolean}
   */
  static async hasRelationship({
    sourceType,
    sourceId,
    relationType,
    targetType,
    targetId,
    orgId = null,
  }) {
    const where = {
      source_type: sourceType,
      source_id: sourceId,
      relation_type: relationType,
      target_type: targetType,
      target_id: targetId,
      is_active: true,
    };

    if (orgId) {
      where.org_id = orgId;
    }

    const relationship = await Relationship.findOne({ where });
    return !!relationship;
  }

  /**
   * Check if user has access via relationship chain
   * @param {Object} params
   * @param {string} params.userId - User ID
   * @param {string} params.resourceType - Resource type
   * @param {string} params.resourceId - Resource ID
   * @param {string} [params.orgId] - Organization context
   * @returns {boolean}
   */
  static async hasAccessViaRelationship({
    userId,
    resourceType,
    resourceId,
    orgId = null,
  }) {
    // Direct ownership
    const isOwner = await this.hasRelationship({
      sourceType: 'user',
      sourceId: userId,
      relationType: 'owner',
      targetType: resourceType,
      targetId: resourceId,
      orgId,
    });
    if (isOwner) return true;

    // Check via organization membership
    if (orgId) {
      const isOrgMember = await this.hasRelationship({
        sourceType: 'user',
        sourceId: userId,
        relationType: 'member',
        targetType: 'organization',
        targetId: orgId,
        orgId,
      });
      if (isOrgMember) {
        // Check if org has access to resource
        const orgHasAccess = await this.hasRelationship({
          sourceType: 'organization',
          sourceId: orgId,
          relationType: 'owns',
          targetType: resourceType,
          targetId: resourceId,
          orgId,
        });
        if (orgHasAccess) return true;
      }
    }

    // Check via role membership
    const roleMemberships = await Relationship.findAll({
      where: {
        source_type: 'user',
        source_id: userId,
        relation_type: 'has_role',
        target_type: 'role',
        is_active: true,
        ...(orgId && { org_id: orgId }),
      },
    });

    for (const membership of roleMemberships) {
      const roleHasAccess = await this.hasRelationship({
        sourceType: 'role',
        sourceId: membership.target_id,
        relationType: 'can_access',
        targetType: resourceType,
        targetId: resourceId,
        orgId,
      });
      if (roleHasAccess) return true;
    }

    // Check transitive relationships (e.g., user -> team -> project)
    const transitiveAccess = await this.checkTransitiveAccess({
      userId,
      resourceType,
      resourceId,
      orgId,
    });

    return transitiveAccess;
  }

  /**
   * Check transitive access (follow relationship chains)
   */
  static async checkTransitiveAccess({ userId, resourceType, resourceId, orgId }) {
    // Get all relationships where user is source
    const userRelationships = await Relationship.findAll({
      where: {
        source_type: 'user',
        source_id: userId,
        is_active: true,
        ...(orgId && { org_id: orgId }),
      },
    });

    // For each relationship, check if target has access to resource
    for (const rel of userRelationships) {
      // Check if target entity has access to resource
      const targetHasAccess = await this.hasRelationship({
        sourceType: rel.target_type,
        sourceId: rel.target_id,
        relationType: 'can_access',
        targetType: resourceType,
        targetId: resourceId,
        orgId,
      });

      if (targetHasAccess) return true;

      // Recursively check transitive access
      if (rel.target_type === 'organization' || rel.target_type === 'group') {
        const transitive = await this.checkTransitiveAccess({
          userId: rel.target_id,
          resourceType,
          resourceId,
          orgId,
        });
        if (transitive) return true;
      }
    }

    return false;
  }

  /**
   * Create a relationship
   */
  static async createRelationship({
    sourceType,
    sourceId,
    relationType,
    targetType,
    targetId,
    orgId = null,
    metadata = {},
  }) {
    const [relationship, created] = await Relationship.findOrCreate({
      where: {
        source_type: sourceType,
        source_id: sourceId,
        relation_type: relationType,
        target_type: targetType,
        target_id: targetId,
        ...(orgId && { org_id: orgId }),
      },
      defaults: {
        org_id: orgId,
        metadata,
        is_active: true,
      },
    });

    if (!created) {
      // Update existing relationship
      await relationship.update({
        is_active: true,
        metadata: { ...relationship.metadata, ...metadata },
      });
    }

    return relationship;
  }

  /**
   * Delete a relationship
   */
  static async deleteRelationship({
    sourceType,
    sourceId,
    relationType,
    targetType,
    targetId,
    orgId = null,
  }) {
    const relationship = await Relationship.findOne({
      where: {
        source_type: sourceType,
        source_id: sourceId,
        relation_type: relationType,
        target_type: targetType,
        target_id: targetId,
        ...(orgId && { org_id: orgId }),
      },
    });

    if (relationship) {
      await relationship.update({ is_active: false });
    }

    return relationship;
  }

  /**
   * Get all relationships for an entity
   */
  static async getRelationships({
    entityType,
    entityId,
    relationType = null,
    direction = 'both', // 'incoming', 'outgoing', 'both'
    orgId = null,
  }) {
    const where = {
      is_active: true,
      ...(orgId && { org_id: orgId }),
    };

    if (direction === 'incoming' || direction === 'both') {
      where.target_type = entityType;
      where.target_id = entityId;
    }

    if (direction === 'outgoing' || direction === 'both') {
      where.source_type = entityType;
      where.source_id = entityId;
    }

    if (relationType) {
      where.relation_type = relationType;
    }

    return await Relationship.findAll({ where });
  }

  /**
   * Build relationship graph for user (for caching)
   */
  static async buildUserGraph(userId, orgId = null) {
    const graph = {
      direct: [],
      viaOrganizations: [],
      viaRoles: [],
      viaGroups: [],
    };

    // Direct relationships
    graph.direct = await this.getRelationships({
      entityType: 'user',
      entityId: userId,
      direction: 'outgoing',
      orgId,
    });

    // Via organizations
    const orgMemberships = await OrganizationMembership.findAll({
      where: {
        user_id: userId,
        status: 'active',
        ...(orgId && { org_id: orgId }),
      },
      include: [{ model: Organization }, { model: Role }],
    });

    for (const membership of orgMemberships) {
      graph.viaOrganizations.push({
        organization: membership.Organization,
        role: membership.Role,
        membership,
      });
    }

    return graph;
  }
}

module.exports = RelationshipGraph;

