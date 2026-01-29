
// routes/roles.route.js
const express = require('express');
const Joi = require('joi');
const asyncHandler = require('../../middleware/asyncHandler');
const { authMiddleware, requireSuperAdmin } = require('../../middleware/authMiddleware');
const withKeycloak = require('../../middleware/keycloak.middleware');
const { AppError } = require('../../middleware/errorHandler');
const ResponseHandler = require('../../utils/responseHandler');

const router = express.Router({ mergeParams: true });

/* --------- Validation Schemas --------- */
const createRoleSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow('').optional(),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).allow('').optional(),
});

const compositeRoleSchema = Joi.object({
  roleName: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow('').optional(),
  associatedRoleNames: Joi.array().items(Joi.string()).min(1).required(),
});

const addRemoveCompositeSchema = Joi.object({
  roleNames: Joi.array().items(Joi.string()).min(1).required(),
});

const removeCompositeSchema = Joi.object({
  roleNamesToRemove: Joi.array().items(Joi.string()).min(1).required(),
});

/* --------- Apply Middleware --------- */
router.use(authMiddleware);
router.use(withKeycloak);

/* --------- Routes --------- */

// GET /api/admin/:realm/roles
router.get('/', asyncHandler(async (req, res) => {
  const roles = await req.kc.getRealmRoles();
  return ResponseHandler.success(res, roles, 'Realm roles retrieved successfully');
}));

// POST /api/admin/:realm/roles
router.post('/', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { error, value } = createRoleSchema.validate(req.body);
  if (error) throw new AppError(error.message, 400, 'VALIDATION_ERROR');

  const role = await req.kc.createRealmRole(value.name, value.description);
  return ResponseHandler.created(res, role, 'Realm role created successfully');
}));

// PATCH /api/admin/:realm/roles/:roleId
router.patch('/:roleId', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { error, value } = updateRoleSchema.validate(req.body);
  if (error) throw new AppError(error.message, 400, 'VALIDATION_ERROR');

  const role = await req.kc.updateRealmRole(req.params.roleId, value);
  return ResponseHandler.success(res, role, 'Realm role updated successfully');
}));

// DELETE /api/admin/:realm/roles/:roleId
router.delete('/:roleId', requireSuperAdmin(), asyncHandler(async (req, res) => {
  await req.kc.deleteRealmRole(req.params.roleId);
  return ResponseHandler.noContent(res, 'Realm role deleted successfully');
}));

// GET /api/admin/:realm/roles/stats
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await req.kc.getRolesWithStats();
  return ResponseHandler.success(res, stats, 'Role statistics retrieved successfully');
}));

// GET /api/admin/:realm/roles/:roleName
router.get('/:roleName', asyncHandler(async (req, res, next) => {
  // Ensure we don't match "stats" or other reserved words if they slipped through
  if (req.params.roleName === 'stats') return next();

  const role = await req.kc.getRealmRole(req.params.roleName);
  return ResponseHandler.success(res, role, 'Realm role details retrieved successfully');
}));

// GET /api/admin/:realm/roles/:roleName/users
router.get('/:roleName/users', asyncHandler(async (req, res) => {
  const users = await req.kc.getUsersInRealmRole(req.params.roleName, req.kc.realm);
  return ResponseHandler.success(res, users, 'Users in role retrieved successfully');
}));

// POST /api/admin/:realm/roles/composite
router.post('/composite', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { error, value } = compositeRoleSchema.validate(req.body);
  if (error) throw new AppError(error.message, 400, 'VALIDATION_ERROR');

  const role = await req.kc.createCompositeRole(value.roleName, value.description, value.associatedRoleNames);
  return ResponseHandler.created(res, role, 'Composite role created successfully');
}));

// GET /api/admin/:realm/roles/:roleName/composites
router.get('/:roleName/composites', asyncHandler(async (req, res) => {
  const roles = await req.kc.getAssociatedRoles(req.params.roleName);
  return ResponseHandler.success(res, roles, 'Composite associated roles retrieved successfully');
}));

// POST /api/admin/:realm/roles/:roleName/composites/add
router.post('/:roleName/composites/add', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { error, value } = addRemoveCompositeSchema.validate(req.body);
  if (error) throw new AppError(error.message, 400, 'VALIDATION_ERROR');

  await req.kc.addAssociatedRolesToCompositeRole(req.params.roleName, value.roleNames);
  return ResponseHandler.success(res, null, 'Roles added to composite role successfully');
}));

// POST /api/admin/:realm/roles/:roleName/composites/remove
router.post('/:roleName/composites/remove', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { error, value } = removeCompositeSchema.validate(req.body);
  if (error) throw new AppError(error.message, 400, 'VALIDATION_ERROR');

  await req.kc.removeAssociatedRoles(req.params.roleName, value.roleNamesToRemove);
  return ResponseHandler.success(res, null, 'Roles removed from composite role successfully');
}));

module.exports = router;
