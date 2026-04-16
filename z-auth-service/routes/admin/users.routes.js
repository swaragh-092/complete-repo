
// routes/users.route.js
const express = require('express');
const Joi = require('joi');
const asyncHandler = require('../../middleware/asyncHandler');
const { authMiddleware, requireSuperAdmin } = require('../../middleware/authMiddleware');
const withKeycloak = require('../../middleware/keycloak.middleware');
const { AppError } = require('../../middleware/errorHandler');
const ResponseHandler = require('../../utils/responseHandler');

const router = express.Router({ mergeParams: true });

/* --------- Validation Schemas --------- */
const createUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  password: Joi.string().min(6).max(100).required(),
  org_id: Joi.string().alphanum().optional(),
  enabled: Joi.boolean().optional().default(true),
});

const updateUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).optional(),
  email: Joi.string().email().optional(),
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  enabled: Joi.boolean().optional(),
  org_id: Joi.string().alphanum().optional(),
  attributes: Joi.object().optional()
}).min(1);

const passwordResetSchema = Joi.object({
  newPassword: Joi.string().min(6).max(100).required(),
  temporary: Joi.boolean().optional().default(false),
});

const passwordSetSchema = Joi.object({
  password: Joi.string().min(6).max(100).required(),
  temporary: Joi.boolean().optional().default(false),
});

const validatePasswordSchema = Joi.object({
  username: Joi.string().required(),
  currentPassword: Joi.string().required(),
  clientId: Joi.string().optional()
});

/* --------- Apply Middleware --------- */
router.use(authMiddleware); // Apply globally or per route
router.use(withKeycloak);

/* --------- Routes --------- */

// GET /api/admin/:realm/users
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const first = (parseInt(page) - 1) * parseInt(limit);
  const max = parseInt(limit);

  const [users, totalCount] = await Promise.all([
    req.kc.getAllUser({ first, max, search }),
    req.kc.countUsers()
  ]);

  const sanitizedUsers = users.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    enabled: user.enabled,
    emailVerified: user.emailVerified,
    createdTimestamp: user.createdTimestamp,
    attributes: user.attributes,
  }));

  return ResponseHandler.paginated(res, sanitizedUsers, page, limit, totalCount, 'Users retrieved successfully');
}));

// POST /api/admin/:realm/users
router.post('/', asyncHandler(async (req, res) => {
  const { error, value } = createUserSchema.validate(req.body);
  if (error) throw new AppError(error.message, 400, 'VALIDATION_ERROR');

  const user = await req.kc.createUser(value);
  return ResponseHandler.created(res, { userId: user.id }, 'User created successfully');
}));

// GET /api/admin/:realm/users/:userId
router.get('/:userId', asyncHandler(async (req, res) => {
  const user = await req.kc.getUser(req.params.userId);
  delete user.credentials;
  return ResponseHandler.success(res, user, 'User details retrieved successfully');
}));

// PATCH /api/admin/:realm/users/:userId
router.patch('/:userId', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { error, value } = updateUserSchema.validate(req.body);
  if (error) throw new AppError(error.message, 400, 'VALIDATION_ERROR');

  await req.kc.updateUser(req.params.userId, value);
  return ResponseHandler.success(res, { userId: req.params.userId }, 'User updated successfully');
}));

// DELETE /api/admin/:realm/users/:userId
router.delete('/:userId', requireSuperAdmin(), asyncHandler(async (req, res) => {
  await req.kc.deleteUser(req.params.userId);
  return ResponseHandler.noContent(res, 'User deleted successfully');
}));

// POST /api/admin/:realm/users/:userId/password/reset
router.post('/:userId/password/reset', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) throw new AppError('newPassword is required', 400, 'VALIDATION_ERROR');

  await req.kc.resetUserPassword(req.params.userId, newPassword);
  return ResponseHandler.success(res, { userId: req.params.userId }, 'Password reset successfully');
}));

// POST /api/admin/:realm/users/:userId/password/set
router.post('/:userId/password/set', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { error, value } = passwordSetSchema.validate(req.body);
  if (error) throw new AppError(error.message, 400, 'VALIDATION_ERROR');

  await req.kc.setUserPassword(req.params.userId, value.password, value.temporary);
  return ResponseHandler.success(res, { userId: req.params.userId }, 'Password set successfully');
}));

// POST /api/admin/:realm/users/:userId/password/validate
router.post('/:userId/password/validate', asyncHandler(async (req, res) => {
  const { error, value } = validatePasswordSchema.validate(req.body);
  if (error) throw new AppError(error.message, 400, 'VALIDATION_ERROR');

  const isValid = await req.kc.validateCurrentPassword(value.username, value.currentPassword, value.clientId);
  return ResponseHandler.success(res, { valid: isValid }, 'Password validation result');
}));

// PATCH /api/admin/:realm/users/:userId/attributes
router.patch('/:userId/attributes', asyncHandler(async (req, res) => {
  const attributes = req.body;
  await req.kc.updateUserAttributes(req.params.userId, attributes);
  return ResponseHandler.success(res, { userId: req.params.userId, attributes }, 'User attributes updated successfully');
}));

// POST /api/admin/:realm/users/:userId/send-password-reset
router.post('/:userId/send-password-reset', requireSuperAdmin(), asyncHandler(async (req, res) => {
  await req.kc.sendPasswordResetEmail(req.params.userId);
  return ResponseHandler.success(res, null, 'Password reset email sent');
}));

// POST /api/admin/:realm/users/:userId/email/verify
router.post('/:userId/email/verify', asyncHandler(async (req, res) => {
  const result = await req.kc.verifyUserEmail(req.params.userId);
  return ResponseHandler.success(res, result, 'Email verification result');
}));

// POST /api/admin/:realm/users/:userId/send-verify-email
router.post('/:userId/send-verify-email', asyncHandler(async (req, res) => {
  await req.kc.sendVerificationEmail(req.params.userId);
  return ResponseHandler.success(res, null, 'Verification email sent');
}));

// GET /api/admin/:realm/users/:userId/credentials
router.get('/:userId/credentials', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const credentials = await req.kc.getUserCredentials(req.params.userId);
  return ResponseHandler.success(res, credentials, 'User credentials retrieved successfully');
}));

// DELETE /api/admin/:realm/users/:userId/credentials/:credentialId
router.delete('/:userId/credentials/:credentialId', requireSuperAdmin(), asyncHandler(async (req, res) => {
  await req.kc.deleteUserCredential(req.params.userId, req.params.credentialId);
  return ResponseHandler.noContent(res, 'Credential deleted successfully');
}));

// GET /api/admin/:realm/users/:userId/sessions
router.get('/:userId/sessions', asyncHandler(async (req, res) => {
  const sessions = await req.kc.userSession(req.params.userId);
  return ResponseHandler.success(res, sessions, 'User sessions retrieved successfully');
}));

// POST /api/admin/:realm/users/:userId/sessions/force-logout
router.post('/:userId/sessions/force-logout', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const count = await req.kc.forceLogoutAllUserSessions(req.params.userId);
  return ResponseHandler.success(res, { count }, `Logged out from ${count} sessions successfully`);
}));

// POST /api/admin/:realm/users/:userId/logout
router.post('/:userId/logout', requireSuperAdmin(), asyncHandler(async (req, res) => {
  await req.kc.logoutUserSession(req.params.userId);
  return ResponseHandler.success(res, null, 'User logged out successfully');
}));

// POST /api/admin/:realm/users/:userId/cache/clear
router.post('/:userId/cache/clear', requireSuperAdmin(), asyncHandler(async (req, res) => {
  await req.kc.clearUserCache(req.params.userId);
  return ResponseHandler.success(res, null, 'User cache cleared successfully');
}));

// GET /api/admin/:realm/users/:userId/events
router.get('/:userId/events', asyncHandler(async (req, res) => {
  const { first, max } = req.query;
  const events = await req.kc.getUserEvents(req.kc.realm, req.params.userId, { first, max });
  return ResponseHandler.success(res, events, 'User events retrieved successfully');
}));

/* --------- TOTP Routes --------- */

router.get('/:userId/totp/status', asyncHandler(async (req, res) => {
  const status = await req.kc.getUserTOTPStatus(req.params.userId);
  return ResponseHandler.success(res, status, 'TOTP status retrieved successfully');
}));

router.post('/:userId/totp/require', requireSuperAdmin(), asyncHandler(async (req, res) => {
  await req.kc.requireUserTOTPSetup(req.params.userId);
  return ResponseHandler.success(res, null, 'TOTP setup required for user');
}));

router.post('/:userId/totp/email', requireSuperAdmin(), asyncHandler(async (req, res) => {
  await req.kc.sendTOTPConfigurationEmail(req.params.userId);
  return ResponseHandler.success(res, null, 'TOTP configuration email sent');
}));

router.post('/:userId/totp/finalize', asyncHandler(async (req, res) => {
  await req.kc.finalizeTOTPSetup(req.params.userId);
  return ResponseHandler.success(res, null, 'TOTP setup finalized successfully');
}));

router.delete('/:userId/totp/:credentialId', requireSuperAdmin(), asyncHandler(async (req, res) => {
  await req.kc.removeTOTPCredential(req.params.userId, req.params.credentialId);
  return ResponseHandler.noContent(res, 'TOTP credential removed successfully');
}));

/* --------- Role Assignment Routes --------- */

// GET /api/admin/:realm/users/:userId/roles/realm
router.get('/:userId/roles/realm', asyncHandler(async (req, res) => {
  const roles = await req.kc.getUserRealmRoles(req.params.userId);
  return ResponseHandler.success(res, roles, 'User realm roles retrieved successfully');
}));

router.post('/:userId/roles/realm/assign', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { roles } = req.body;
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    throw new AppError('roles array is required', 400, 'VALIDATION_ERROR');
  }

  await req.kc.assignRealmRolesToUser(req.params.userId, roles);
  return ResponseHandler.success(res, { roles }, 'Realm roles assigned successfully');
}));

router.post('/:userId/roles/realm/remove', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { roles } = req.body;
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    throw new AppError('roles array is required', 400, 'VALIDATION_ERROR');
  }

  await req.kc.removeRealmRolesFromUser(req.params.userId, roles);
  return ResponseHandler.success(res, { roles }, 'Realm roles removed successfully');
}));

// GET /api/admin/:realm/users/:userId/roles
router.get('/:userId/roles', asyncHandler(async (req, res) => {
  const roles = await req.kc.getUserRoles(req.params.userId);
  return ResponseHandler.success(res, roles, 'User roles retrieved successfully');
}));

// GET /api/admin/:realm/users/:userId/roles/client/:clientId
router.get('/:userId/roles/client/:clientId', asyncHandler(async (req, res) => {
  const roles = await req.kc.getUserClientRoles(req.params.userId, req.params.clientId);
  return ResponseHandler.success(res, roles, 'User client roles retrieved successfully');
}));

// POST /api/admin/:realm/users/:userId/roles/client/:clientId
router.post('/:userId/roles/client/:clientId', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { roles } = req.body;
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    throw new AppError('roles array is required', 400, 'VALIDATION_ERROR');
  }

  await req.kc.assignClientRolesToUser(req.params.userId, req.params.clientId, roles);
  return ResponseHandler.success(res, { roles }, 'Client roles assigned successfully');
}));

// DELETE /api/admin/:realm/users/:userId/roles/client/:clientId
router.delete('/:userId/roles/client/:clientId', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { roles } = req.body;
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    throw new AppError('roles array is required', 400, 'VALIDATION_ERROR');
  }

  await req.kc.removeClientRolesFromUser(req.params.userId, req.params.clientId, roles);
  return ResponseHandler.success(res, { roles }, 'Client roles removed successfully');
}));

module.exports = router;
