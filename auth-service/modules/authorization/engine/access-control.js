// services/authorization.service.js - Unified Authorization Service (RBAC + ABAC + ReBAC)

const crypto = require('crypto');

const PolicyEngine = require('./policy-engine');
const RelationshipGraph = require('./relationship-graph');
const { Role, Permission, OrganizationMembership } = require('../../../config/database');
const { Op } = require('sequelize');

class AuthorizationService {
  /**
   * Unified authorization check combining RBAC, ABAC, and ReBAC
   * @param {Object} params
   * @param {Object} params.user - User object from req.user
   * @param {string} params.action - Action being performed
   * @param {Object} params.resource - Resource being accessed
   * @param {Object} [params.environment] - Environment context
   * @param {Object} [params.options] - Authorization options
   * @returns {Object} - { allowed: boolean, method: string, reason: string }
   */
  static async checkAccess({
    user,
    action,
    resource,
    environment = {},
    options = {},
  }) {
    const {
      requireAll = false, // Require all methods (AND) vs any method (OR)
      skipRBAC = false,
      skipABAC = false,
      skipReBAC = false,
    } = options;

    const results = {
      rbac: null,
      abac: null,
      rebac: null,
    };

    // 1. RBAC Check (Role-Based Access Control)
    if (!skipRBAC) {
      const clientId = user.client_id || user.azp || options.clientId || '*';
      results.rbac = await this.checkRBAC({ user, action, resource, clientId });
      if (requireAll && !results.rbac.allowed) {
        return this._buildDecision(false, 'RBAC', results.rbac.reason, results);
      }
      if (!requireAll && results.rbac.allowed) {
        return this._buildDecision(true, 'RBAC', results.rbac.reason, results);
      }
    }

    // 2. ABAC Check (Attribute-Based Access Control)
    if (!skipABAC) {
      results.abac = await this.checkABAC({
        user,
        action,
        resource,
        environment,
      });
      if (requireAll && !results.abac.allowed) {
        return this._buildDecision(false, 'ABAC', results.abac.reason, results);
      }
      if (!requireAll && results.abac.allowed) {
        return this._buildDecision(true, 'ABAC', results.abac.reason, results);
      }
    }

    // 3. ReBAC Check (Relationship-Based Access Control)
    if (!skipReBAC) {
      results.rebac = await this.checkReBAC({
        user,
        action,
        resource,
      });
      if (requireAll && !results.rebac.allowed) {
        return this._buildDecision(false, 'ReBAC', results.rebac.reason, results);
      }
      if (!requireAll && results.rebac.allowed) {
        return this._buildDecision(true, 'ReBAC', results.rebac.reason, results);
      }
    }

    // If requireAll, all methods must allow
    if (requireAll) {
      const allAllowed = Object.values(results).every(
        (r) => r === null || r.allowed
      );
      return this._buildDecision(
        allAllowed,
        'COMBINED',
        allAllowed
          ? 'All authorization methods allow access'
          : 'One or more authorization methods deny access',
        results
      );
    }

    // Default deny
    return this._buildDecision(false, 'NONE', 'No authorization method granted access', results);
  }

  /**
   * RBAC Check - Role and Permission based
   * Uses client-prefixed permission format: client:resource:action
   */
  static async checkRBAC({ user, action, resource, clientId }) {
    const resourceType = resource.type || 'resource';

    // Build permission names to check (client-specific and global wildcard)
    const clientPrefixedPermission = `${clientId || '*'}:${resourceType}:${action}`;
    const globalPermission = `*:${resourceType}:${action}`;

    // Check if user has required permission (client-specific or global)
    const hasClientPermission = user.permissions?.includes(clientPrefixedPermission);
    const hasGlobalPermission = user.permissions?.includes(globalPermission);

    if (hasClientPermission) {
      return {
        allowed: true,
        reason: `User has client-specific permission: ${clientPrefixedPermission}`,
      };
    }

    if (hasGlobalPermission) {
      return {
        allowed: true,
        reason: `User has global permission: ${globalPermission}`,
      };
    }

    // Check if user has required role
    const requiredRole = this.getRequiredRole(action, resource);
    if (requiredRole && user.roles?.includes(requiredRole)) {
      return {
        allowed: true,
        reason: `User has role: ${requiredRole}`,
      };
    }

    // Check organization-specific permissions (using client-prefixed format)
    if (resource.orgId) {
      const orgPermission = await this.checkOrgPermission({
        userId: user.id,
        orgId: resource.orgId,
        permission: clientPrefixedPermission,
        globalPermission: globalPermission,
      });

      if (orgPermission) {
        return {
          allowed: true,
          reason: `User has organization permission: ${clientPrefixedPermission}`,
        };
      }
    }

    return {
      allowed: false,
      reason: `User lacks permission: ${clientPrefixedPermission} and role: ${requiredRole}`,
    };
  }

  /**
   * ABAC Check - Policy-based
   */
  static async checkABAC({ user, action, resource, environment }) {
    // Build subject attributes
    const subject = {
      id: user.sub || user.keycloak_id,
      email: user.email,
      roles: user.roles || [],
      permissions: user.permissions || [],
      department: user.department,
      designation: user.designation,
      organizations: user.organizations?.map((org) => org.id) || [],
      is_active: user.is_active,
    };

    // Get resource attributes if available
    let resourceAttributes = resource.attributes || {};
    if (resource.type && resource.id) {
      const attrs = await PolicyEngine.getResourceAttributes(
        resource.type,
        resource.id,
        resource.orgId
      );
      resourceAttributes = { ...resourceAttributes, ...attrs };
    }

    const resourceContext = {
      type: resource.type || 'resource',
      id: resource.id,
      attributes: resourceAttributes,
      orgId: resource.orgId,
    };

    // Build environment context
    const envContext = {
      ip: environment.ip,
      userAgent: environment.userAgent,
      timestamp: new Date().toISOString(),
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      ...environment,
    };

    // Evaluate policies
    const result = await PolicyEngine.evaluate({
      subject,
      resource: resourceContext,
      action,
      environment: envContext,
      orgId: resource.orgId,
      clientId: user.client_id,
    });

    return {
      allowed: result.allowed,
      reason: result.reason,
      policy: result.policy,
    };
  }

  /**
   * ReBAC Check - Relationship-based
   */
  static async checkReBAC({ user, action, resource }) {
    const userId = user.sub || user.keycloak_id || user.id; // Added fallback to user.id

    if (!userId) {
      return {
        allowed: false,
        reason: 'User identifier missing'
      };
    }

    // Check direct ownership
    const isOwner = await RelationshipGraph.hasRelationship({
      sourceType: 'user',
      sourceId: userId,
      relationType: 'owner',
      targetType: resource.type || 'resource',
      targetId: resource.id,
      orgId: resource.orgId,
    });

    if (isOwner) {
      return {
        allowed: true,
        reason: 'User is owner of the resource',
      };
    }

    // Check access via relationships
    const hasAccess = await RelationshipGraph.hasAccessViaRelationship({
      userId,
      resourceType: resource.type || 'resource',
      resourceId: resource.id,
      orgId: resource.orgId,
    });

    if (hasAccess) {
      return {
        allowed: true,
        reason: 'User has access via relationship chain',
      };
    }

    // Check action-specific relationships
    const actionRelation = this.getActionRelation(action);
    if (actionRelation) {
      const hasActionAccess = await RelationshipGraph.hasRelationship({
        sourceType: 'user',
        sourceId: userId,
        relationType: actionRelation,
        targetType: resource.type || 'resource',
        targetId: resource.id,
        orgId: resource.orgId,
      });

      if (hasActionAccess) {
        return {
          allowed: true,
          reason: `User has ${actionRelation} relationship with resource`,
        };
      }
    }

    return {
      allowed: false,
      reason: 'No relationship found granting access',
    };
  }

  /**
   * Helper: Get required role for action
   */
  static getRequiredRole(action, resource) {
    const roleMap = {
      create: 'admin',
      update: 'admin',
      delete: 'admin',
      read: 'user',
      manage: 'manager',
    };

    return roleMap[action] || null;
  }

  /**
   * Helper: Get action-specific relationship type
   */
  static getActionRelation(action) {
    const relationMap = {
      read: 'can_view',
      update: 'can_edit',
      delete: 'can_delete',
      manage: 'can_manage',
    };

    return relationMap[action] || null;
  }

  /**
   * Check organization-specific permission
   * Supports client-prefixed permission format (client:resource:action)
   */
  static async checkOrgPermission({ userId, orgId, permission, globalPermission }) {
    const { Op } = require('sequelize');

    // Build permission names to check (client-specific and global wildcard)
    const permissionNames = [permission];
    if (globalPermission && globalPermission !== permission) {
      permissionNames.push(globalPermission);
    }

    const membership = await OrganizationMembership.findOne({
      where: {
        user_id: userId,
        org_id: orgId,
        status: 'active',
      },
      include: [
        {
          model: Role,
          include: [
            {
              model: Permission,
              where: {
                name: { [Op.in]: permissionNames }
              },
              required: false,
            },
          ],
        },
      ],
    });

    return membership?.Role?.Permissions?.length > 0;
  }

  /**
   * Batch authorization check (for multiple resources)
   */
  static async checkBatchAccess({ user, requests, options = {} }) {
    const results = await Promise.all(
      requests.map((req) =>
        this.checkAccess({
          user,
          action: req.action,
          resource: req.resource,
          environment: req.environment || {},
          options,
        })
      )
    );

    return results;
  }

  /**
   * Build a standardized decision object with audit fields
   * @private
   */
  static _buildDecision(allowed, method, reason, results = null) {
    return {
      allowed,
      method,
      reason,
      decisionId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...(results && { results }),
    };
  }
}

module.exports = AuthorizationService;








