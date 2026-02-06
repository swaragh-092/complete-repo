// routes/authorization.route.js - Authorization Management API

const express = require('express');
const Joi = require('joi');
const asyncHandler = require('../../../middleware/asyncHandler');
const { authMiddleware } = require('../../../middleware/authMiddleware');
const { AppError } = require('../../../middleware/errorHandler');
const { authorize, authorizeRBAC } = require('../middleware');
const { Policy, Relationship, ResourceAttribute } = require('../../../config/database');
const PolicyEngine = require('../engine/policy-engine');
const RelationshipGraph = require('../engine/relationship-graph');
const AuthorizationService = require('../engine/access-control');
const ResponseHandler = require('../../../utils/responseHandler');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/* ========== POLICY MANAGEMENT (ABAC) ========== */

const policySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  org_id: Joi.string().uuid().allow(null).optional(),
  client_id: Joi.string().allow(null).optional(),
  effect: Joi.string().valid('allow', 'deny').required(),
  priority: Joi.number().integer().default(0),
  resources: Joi.array().items(Joi.string()).default([]),
  actions: Joi.array().items(Joi.string()).default([]),
  subjects: Joi.object().default({}),
  conditions: Joi.object().default({}),
  environment: Joi.object().default({}),
  is_active: Joi.boolean().default(true),
});

// GET /authorization/policies - List policies
router.get(
  '/policies',
  authorizeRBAC('policy:read'),
  asyncHandler(async (req, res) => {
    const { org_id, client_id, is_active, page = 1, limit = 50 } = req.query;

    const where = {};
    if (org_id) where.org_id = org_id;
    if (client_id) where.client_id = client_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Policy.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['priority', 'DESC'], ['created_at', 'DESC']],
    });

    return ResponseHandler.paginated(res, rows, page, limit, count, 'Policies retrieved successfully');
  })
);

// GET /authorization/policies/:id - Get policy
router.get(
  '/policies/:id',
  authorizeRBAC('policy:read'),
  asyncHandler(async (req, res) => {
    const policy = await Policy.findByPk(req.params.id);

    if (!policy) {
      throw new AppError('Policy does not exist', 404, 'NOT_FOUND');
    }

    return ResponseHandler.success(res, policy, 'Policy retrieved successfully');
  })
);

// POST /authorization/policies - Create policy
router.post(
  '/policies',
  authorizeRBAC('policy:create'),
  asyncHandler(async (req, res) => {
    const { error, value } = policySchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const policy = await Policy.create(value);

    return ResponseHandler.created(res, policy, 'Policy created successfully');
  })
);

// PUT /authorization/policies/:id - Update policy
router.put(
  '/policies/:id',
  authorizeRBAC('policy:update'),
  asyncHandler(async (req, res) => {
    const policy = await Policy.findByPk(req.params.id);

    if (!policy) {
      throw new AppError('Policy does not exist', 404, 'NOT_FOUND');
    }

    if (policy.is_system) {
      throw new AppError('System policies cannot be modified', 403, 'FORBIDDEN');
    }

    const { error, value } = policySchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    await policy.update(value);

    return ResponseHandler.success(res, policy, 'Policy updated successfully');
  })
);

// DELETE /authorization/policies/:id - Delete policy
router.delete(
  '/policies/:id',
  authorizeRBAC('policy:delete'),
  asyncHandler(async (req, res) => {
    const policy = await Policy.findByPk(req.params.id);

    if (!policy) {
      throw new AppError('Policy does not exist', 404, 'NOT_FOUND');
    }

    if (policy.is_system) {
      throw new AppError('System policies cannot be deleted', 403, 'FORBIDDEN');
    }

    await policy.destroy();

    return ResponseHandler.success(res, null, 'Policy deleted successfully');
  })
);

// POST /authorization/policies/:id/test - Test policy
router.post(
  '/policies/:id/test',
  authorizeRBAC('policy:read'),
  asyncHandler(async (req, res) => {
    const policy = await Policy.findByPk(req.params.id);

    if (!policy) {
      throw new AppError('Policy does not exist', 404, 'NOT_FOUND');
    }

    const { subject, resource, action, environment } = req.body;

    const matches = PolicyEngine.matchesPolicy(policy, {
      subject,
      resource,
      action,
      environment,
    });

    return ResponseHandler.success(res, {
      matches,
      effect: matches ? policy.effect : null,
    }, 'Policy test result');
  })
);

/* ========== RELATIONSHIP MANAGEMENT (ReBAC) ========== */

const relationshipSchema = Joi.object({
  source_type: Joi.string().valid('user', 'organization', 'resource', 'role', 'group').required(),
  source_id: Joi.string().required(),
  relation_type: Joi.string().required(),
  target_type: Joi.string().valid('user', 'organization', 'resource', 'role', 'group').required(),
  target_id: Joi.string().required(),
  org_id: Joi.string().uuid().allow(null).optional(),
  metadata: Joi.object().default({}),
});

// GET /authorization/relationships - List relationships
router.get(
  '/relationships',
  authorizeRBAC('relationship:read'),
  asyncHandler(async (req, res) => {
    const {
      source_type,
      source_id,
      target_type,
      target_id,
      relation_type,
      org_id,
      page = 1,
      limit = 50,
    } = req.query;

    const where = { is_active: true };
    if (source_type) where.source_type = source_type;
    if (source_id) where.source_id = source_id;
    if (target_type) where.target_type = target_type;
    if (target_id) where.target_id = target_id;
    if (relation_type) where.relation_type = relation_type;
    if (org_id) where.org_id = org_id;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Relationship.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    return ResponseHandler.paginated(res, rows, page, limit, count, 'Relationships retrieved successfully');
  })
);

// POST /authorization/relationships - Create relationship
router.post(
  '/relationships',
  authorizeRBAC('relationship:create'),
  asyncHandler(async (req, res) => {
    const { error, value } = relationshipSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const relationship = await RelationshipGraph.createRelationship(value);

    return ResponseHandler.created(res, relationship, 'Relationship created successfully');
  })
);

// DELETE /authorization/relationships/:id - Delete relationship
router.delete(
  '/relationships/:id',
  authorizeRBAC('relationship:delete'),
  asyncHandler(async (req, res) => {
    const relationship = await Relationship.findByPk(req.params.id);

    if (!relationship) {
      throw new AppError('Relationship does not exist', 404, 'NOT_FOUND');
    }

    await relationship.update({ is_active: false });

    return ResponseHandler.success(res, null, 'Relationship deleted successfully');
  })
);

// GET /authorization/relationships/check - Check relationship
router.get(
  '/relationships/check',
  authorizeRBAC('relationship:read'),
  asyncHandler(async (req, res) => {
    const {
      source_type,
      source_id,
      relation_type,
      target_type,
      target_id,
      org_id,
    } = req.query;

    const hasRelationship = await RelationshipGraph.hasRelationship({
      sourceType: source_type,
      sourceId: source_id,
      relationType: relation_type,
      targetType: target_type,
      targetId: target_id,
      orgId: org_id || null,
    });

    return ResponseHandler.success(res, { hasRelationship }, 'Relationship check result');
  })
);

/* ========== RESOURCE ATTRIBUTES (ABAC) ========== */

// GET /authorization/resources/:type/:id/attributes
router.get(
  '/resources/:type/:id/attributes',
  authorizeRBAC('resource:read'),
  asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    const orgId = req.query.org_id || req.user?.organizations?.[0]?.id;

    const attributes = await PolicyEngine.getResourceAttributes(type, id, orgId);

    return ResponseHandler.success(res, {
      resource_type: type,
      resource_id: id,
      attributes,
    }, 'Resource attributes retrieved successfully');
  })
);

// PUT /authorization/resources/:type/:id/attributes
router.put(
  '/resources/:type/:id/attributes',
  authorizeRBAC('resource:update'),
  asyncHandler(async (req, res) => {
    const { type, id } = req.params;
    const { attributes, classification, tags } = req.body;
    const orgId = req.body.org_id || req.user?.organizations?.[0]?.id;

    const [resourceAttr, created] = await ResourceAttribute.findOrCreate({
      where: {
        resource_type: type,
        resource_id: id,
      },
      defaults: {
        org_id: orgId,
        attributes: attributes || {},
        classification: classification || 'internal',
        tags: tags || [],
      },
    });

    if (!created) {
      await resourceAttr.update({
        attributes: { ...resourceAttr.attributes, ...attributes },
        classification: classification || resourceAttr.classification,
        tags: tags || resourceAttr.tags,
      });
    }

    return ResponseHandler.success(res, resourceAttr, 'Resource attributes updated successfully');
  })
);

/* ========== AUTHORIZATION CHECK ========== */

// POST /authorization/check - Check access
router.post(
  '/check',
  asyncHandler(async (req, res) => {
    const { action, resource, environment, options } = req.body;

    const result = await AuthorizationService.checkAccess({
      user: req.user,
      action,
      resource,
      environment: environment || {},
      options: options || {},
    });

    return ResponseHandler.success(res, result, 'Access check completed');
  })
);

// POST /authorization/check-batch - Batch check access
router.post(
  '/check-batch',
  asyncHandler(async (req, res) => {
    const { requests, options } = req.body;

    const results = await AuthorizationService.checkBatchAccess({
      user: req.user,
      requests,
      options: options || {},
    });

    return ResponseHandler.success(res, { results }, 'Batch access check completed');
  })
);

module.exports = router;








