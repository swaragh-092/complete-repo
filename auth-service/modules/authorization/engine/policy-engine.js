// services/policy-engine.service.js - ABAC Policy Evaluation Engine

const { Policy, ResourceAttribute } = require('../../../config/database');
const { Op } = require('sequelize');

// In-memory policy cache
const _policyCache = new Map();
const CACHE_TTL = 60_000; // 60 seconds
let _cacheStats = { hits: 0, misses: 0 };

class PolicyEngine {
  /**
   * Evaluate ABAC policies for a request
   * @param {Object} context - Authorization context
   * @param {Object} context.subject - Subject (user) attributes
   * @param {Object} context.resource - Resource attributes
   * @param {Object} context.action - Action being performed
   * @param {Object} context.environment - Environment attributes (IP, time, etc.)
   * @param {string} [context.orgId] - Organization ID
   * @param {string} [context.clientId] - Client ID
   * @returns {Object} - { allowed: boolean, policy: Policy, reason: string }
   */
  static async evaluate(context) {
    const {
      subject,
      resource,
      action,
      environment = {},
      orgId = null,
      clientId = null,
    } = context;

    // Build query for applicable policies
    const whereClause = {
      is_active: true,
      [Op.or]: [
        { org_id: null }, // Global policies
        { org_id: orgId }, // Org-specific policies
      ],
    };

    if (clientId) {
      whereClause[Op.or].push({ client_id: null }, { client_id: clientId });
    }

    // Check cache first
    const cacheKey = `${orgId || 'global'}:${clientId || 'all'}`;
    const cached = _policyCache.get(cacheKey);
    let policies;

    if (cached && Date.now() - cached.time < CACHE_TTL) {
      policies = cached.policies;
      _cacheStats.hits++;
    } else {
      // Get all applicable policies, ordered by priority
      policies = await Policy.findAll({
        where: whereClause,
        order: [['priority', 'DESC'], ['created_at', 'ASC']],
      });

      _policyCache.set(cacheKey, { policies, time: Date.now() });
      _cacheStats.misses++;
    }

    // Evaluate policies in priority order
    for (const policy of policies) {
      const matches = this.matchesPolicy(policy, {
        subject,
        resource,
        action,
        environment,
      });

      if (matches) {
        return {
          allowed: policy.effect === 'allow',
          policy: policy.name,
          effect: policy.effect,
          priority: policy.priority,
          reason: `Policy "${policy.name}" ${policy.effect === 'allow' ? 'allows' : 'denies'} this action`,
        };
      }
    }

    // Default deny if no policy matches
    return {
      allowed: false,
      policy: null,
      effect: 'deny',
      reason: 'No matching policy found - default deny',
    };
  }

  /**
   * Check if a policy matches the context
   */
  static matchesPolicy(policy, context) {
    const { subject, resource, action, environment } = context;

    // Check resource match
    if (policy.resources && policy.resources.length > 0) {
      const resourceMatch = policy.resources.some((pattern) =>
        this.matchPattern(resource.type || resource.id, pattern)
      );
      if (!resourceMatch) return false;
    }

    // Check action match
    if (policy.actions && policy.actions.length > 0) {
      const actionMatch = policy.actions.includes(action) ||
        policy.actions.some((pattern) => this.matchPattern(action, pattern));
      if (!actionMatch) return false;
    }

    // Check subject conditions
    if (policy.subjects && Object.keys(policy.subjects).length > 0) {
      if (!this.evaluateConditions(policy.subjects, subject)) {
        return false;
      }
    }

    // Check resource conditions (if resource attributes are provided)
    if (policy.conditions?.resource && resource.attributes) {
      if (!this.evaluateConditions(policy.conditions.resource, resource.attributes)) {
        return false;
      }
    }

    // Check environment conditions
    if (policy.environment && Object.keys(policy.environment).length > 0) {
      if (!this.evaluateConditions(policy.environment, environment)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate conditions against attributes
   */
  static evaluateConditions(conditions, attributes) {
    for (const [key, condition] of Object.entries(conditions)) {
      const attributeValue = this.getNestedValue(attributes, key);

      if (condition === null || condition === undefined) {
        continue; // No condition specified
      }

      // Handle different condition types
      if (typeof condition === 'object') {
        // Complex condition (e.g., { $in: [...], $gte: 10 })
        if (!this.evaluateComplexCondition(condition, attributeValue)) {
          return false;
        }
      } else {
        // Simple equality check
        if (attributeValue !== condition) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Evaluate complex conditions (operators)
   */
  static evaluateComplexCondition(condition, value) {
    for (const [operator, expected] of Object.entries(condition)) {
      switch (operator) {
        case '$eq':
          return value === expected;
        case '$ne':
          return value !== expected;
        case '$in':
          return Array.isArray(expected) && expected.includes(value);
        case '$nin':
          return Array.isArray(expected) && !expected.includes(value);
        case '$gt':
          return value > expected;
        case '$gte':
          return value >= expected;
        case '$lt':
          return value < expected;
        case '$lte':
          return value <= expected;
        case '$contains':
          return Array.isArray(value) && value.includes(expected);
        case '$regex':
          return new RegExp(expected).test(value);
        case '$exists':
          return expected ? value !== undefined : value === undefined;
        default:
          return false;
      }
    }
    return true;
  }

  /**
   * Match pattern (supports wildcards)
   */
  static matchPattern(value, pattern) {
    if (pattern === '*') return true;
    if (pattern === value) return true;

    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(value);
  }

  /**
   * Get nested value from object (e.g., 'user.department')
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get resource attributes
   */
  static async getResourceAttributes(resourceType, resourceId, orgId = null) {
    const attr = await ResourceAttribute.findOne({
      where: {
        resource_type: resourceType,
        resource_id: resourceId,
        ...(orgId && { org_id: orgId }),
      },
    });

    return attr ? attr.attributes : {};
  }

  /**
   * Clear the policy cache (call after policy create/update/delete)
   */
  static clearCache() {
    _policyCache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  static getCacheStats() {
    return {
      size: _policyCache.size,
      hits: _cacheStats.hits,
      misses: _cacheStats.misses,
      hitRate: _cacheStats.hits + _cacheStats.misses > 0
        ? (_cacheStats.hits / (_cacheStats.hits + _cacheStats.misses) * 100).toFixed(1) + '%'
        : '0%',
    };
  }
}

module.exports = PolicyEngine;








