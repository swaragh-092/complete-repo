const express = require('express');
const Joi = require('joi');
const asyncHandler = require('../../middleware/asyncHandler');
const { authMiddleware, requireSuperAdmin } = require('../../middleware/authMiddleware');
const withKeycloak = require('../../middleware/keycloak.middleware');
const { Realm } = require('../../config/database');

const { AppError } = require('../../middleware/errorHandler');
const ResponseHandler = require('../../utils/responseHandler');

const router = express.Router();

// Apply Keycloak middleware to all routes
router.use(authMiddleware);
router.use(withKeycloak);

/* --------- Validation Schemas --------- */
const realmId = Joi.string().alphanum().min(3).max(50).required();
const createRealmSchema = Joi.object({
  realm_name: realmId,
  display_name: Joi.string().min(3).max(100).required()
});

const realmSettingsSchema = Joi.object({
  displayName: Joi.string().min(3).max(100),
  enabled: Joi.boolean(),
  registrationAllowed: Joi.boolean(),
  registrationEmailAsUsername: Joi.boolean(),
  rememberMe: Joi.boolean(),
  verifyEmail: Joi.boolean(),
  loginWithEmailAllowed: Joi.boolean(),
  duplicateEmailsAllowed: Joi.boolean(),
  resetPasswordAllowed: Joi.boolean(),
  editUsernameAllowed: Joi.boolean(),
  bruteForceProtected: Joi.boolean(),
  permanentLockout: Joi.boolean(),
  maxFailureWaitSeconds: Joi.number().integer().min(1),
  minimumQuickLoginWaitSeconds: Joi.number().integer().min(1),
  waitIncrementSeconds: Joi.number().integer().min(1),
  quickLoginCheckMilliSeconds: Joi.number().integer().min(1),
  maxDeltaTimeSeconds: Joi.number().integer().min(1),
  failureFactor: Joi.number().integer().min(1),

  // Token Settings
  ssoSessionIdleTimeout: Joi.number().integer().min(1),
  ssoSessionMaxLifespan: Joi.number().integer().min(1),
  ssoSessionIdleTimeoutRememberMe: Joi.number().integer().min(1),
  ssoSessionMaxLifespanRememberMe: Joi.number().integer().min(1),
  offlineSessionIdleTimeout: Joi.number().integer().min(1),
  offlineSessionMaxLifespan: Joi.number().integer().min(1),
  accessCodeLifespan: Joi.number().integer().min(1),
  accessCodeLifespanUserAction: Joi.number().integer().min(1),
  accessCodeLifespanLogin: Joi.number().integer().min(1),
  actionTokenGeneratedByAdminLifespan: Joi.number().integer().min(1),
  actionTokenGeneratedByUserLifespan: Joi.number().integer().min(1),
  accessTokenLifespan: Joi.number().integer().min(1),
  accessTokenLifespanForImplicitFlow: Joi.number().integer().min(1),

  passwordPolicy: Joi.alternatives().try(
    Joi.string(),
    Joi.object({
      minLength: Joi.number().integer().min(4),
      requireSpecial: Joi.boolean(),
      requireUppercase: Joi.boolean(),
      requireLowercase: Joi.boolean(),
      requireDigit: Joi.boolean()
    })
  ),

  smtpServer: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives(Joi.string().allow(''), Joi.boolean(), Joi.number())
  )
}).min(1).unknown(true);

/* --------- Routes --------- */
/* 
  IMPORTANT: Route order matters! 
  More specific routes MUST come before generic routes.
  Otherwise /:realmName will match everything including /enabled
*/

// GET /api/admin/realms
router.get('/', asyncHandler(async (req, res) => {
  const realms = await req.kc.getAllRealms();
  return ResponseHandler.success(res, realms, 'Realms retrieved successfully');
}));

//get all realms from keycloak db

router.get('/all', asyncHandler(async (req, res) => {
  const realms = await req.kc.getAllRealms();
  return ResponseHandler.success(res, realms, 'All realms retrieved successfully');
}));

// GET /api/admin/realms/:realmName/users
router.get('/:realmName/users', asyncHandler(async (req, res) => {
  const { realmName } = req.params;
  const users = await req.kc.getAllUser(); // getAllUser() exists in keycloak.service.js
  return ResponseHandler.success(res, users, 'Realm users retrieved successfully');
}));

// GET /api/admin/realms/:realmName/clients  
router.get('/:realmName/clients', asyncHandler(async (req, res) => {
  const { realmName } = req.params;
  const clients = await req.kc.getClients(); // getClients() exists in keycloak.service.js
  return ResponseHandler.success(res, clients, 'Realm clients retrieved successfully');
}));

// POST /api/admin/realms
router.post('/', asyncHandler(async (req, res) => {
  const { error, value } = createRealmSchema.validate(req.body);
  if (error) throw new AppError(error.message, 400, 'VALIDATION_ERROR');

  await req.kc.createRealm(value);

  // Sync with local DB
  try {
    await Realm.create({
      realm_name: value.realm_name,
      display_name: value.display_name,
      tenant_id: null
    });
  } catch (dbError) {
    console.warn('Failed to create realm in local DB:', dbError.message);
  }

  return ResponseHandler.created(res, { realm: value.realm_name }, 'Realm created successfully');
}));

// ✅ SPECIFIC ROUTES FIRST - PATCH /api/admin/realms/:realmName/enabled
router.patch('/:realmName/enabled', asyncHandler(async (req, res) => {
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    throw new AppError('enabled must be boolean', 400, 'VALIDATION_ERROR');
  }

  await req.kc.updateRealm(req.params.realmName, { enabled });
  return ResponseHandler.success(res, { enabled }, `Realm ${enabled ? 'enabled' : 'disabled'} successfully`);
}));

// POST /api/admin/realms/:realmName/clone
router.post('/:realmName/clone', asyncHandler(async (req, res) => {
  const { realmName } = req.params;
  const { newRealmName, newDisplayName } = req.body;

  if (!newRealmName) {
    throw new AppError('newRealmName is required', 400, 'VALIDATION_ERROR');
  }

  const newRealm = await req.kc.cloneRealm(realmName, newRealmName, newDisplayName);

  // Sync with local DB
  try {
    await Realm.create({
      realm_name: newRealmName,
      display_name: newDisplayName || newRealmName,
      tenant_id: null
    });
  } catch (dbError) {
    console.warn('Failed to create cloned realm in local DB:', dbError.message);
  }

  return ResponseHandler.created(res, newRealm, 'Realm cloned successfully');
}));

// ✅ SPECIFIC ROUTES - PATCH /api/admin/realms/:realmName/settings
router.patch('/:realmName/settings', asyncHandler(async (req, res) => {
  const { error, value } = realmSettingsSchema.validate(req.body);
  if (error) throw new AppError(error.message, 400, 'VALIDATION_ERROR');

  // Pre-process passwordPolicy
  if (typeof value.passwordPolicy === 'string') {
    value.passwordPolicy = value.passwordPolicy
      .split(' and ')
      .filter(token => !token.includes('undefined'))
      .join(' and ');
  }

  // Pre-process smtpServer
  if (value.smtpServer) {
    const {
      host, port, from, fromDisplayName, replyTo, replyToDisplayName,
      auth, ssl, starttls, debug, password
    } = value.smtpServer;

    value.smtpServer = {
      host: String(host || ''),
      port: String(port || ''),
      from: String(from || ''),
      fromDisplayName: String(fromDisplayName || ''),
      replyTo: String(replyTo || ''),
      replyToDisplayName: String(replyToDisplayName || ''),
      auth: String(auth || 'false'),
      ssl: String(ssl || 'false'),
      starttls: String(starttls || 'false'),
      debug: String(debug || 'false'),
      password: String(password || ''),
    };
  }

  await req.kc.updateRealm(req.params.realmName, value);
  return ResponseHandler.success(res, null, 'Realm settings updated successfully');
}));

// GET /api/admin/realms/:realmName
router.get('/:realmName', asyncHandler(async (req, res) => {
  const { realmName } = req.params;
  const settings = await req.kc.getRealmSettings(realmName);
  return ResponseHandler.success(res, settings, 'Realm settings retrieved successfully');
}));

// ⚠️ GENERIC ROUTES LAST - PATCH /api/admin/realms/:realmName
router.patch('/:realmName', asyncHandler(async (req, res) => {
  const { error, value } = realmSettingsSchema.validate(req.body);
  if (error) throw new AppError(error.message, 400, 'VALIDATION_ERROR');

  // Pre-process passwordPolicy
  if (typeof value.passwordPolicy === 'string') {
    value.passwordPolicy = value.passwordPolicy
      .split(' and ')
      .filter(token => !token.includes('undefined'))
      .join(' and ');
  }

  // Pre-process smtpServer
  if (value.smtpServer) {
    const {
      host, port, from, fromDisplayName, replyTo, replyToDisplayName,
      auth, ssl, starttls, debug, password
    } = value.smtpServer;

    value.smtpServer = {
      host: String(host || ''),
      port: String(port || ''),
      from: String(from || ''),
      fromDisplayName: String(fromDisplayName || ''),
      replyTo: String(replyTo || ''),
      replyToDisplayName: String(replyToDisplayName || ''),
      auth: String(auth || 'false'),
      ssl: String(ssl || 'false'),
      starttls: String(starttls || 'false'),
      debug: String(debug || 'false'),
      password: String(password || ''),
    };
  }

  await req.kc.updateRealm(req.params.realmName, value);
  return ResponseHandler.success(res, null, 'Realm updated successfully');
}));

// DELETE /api/admin/realms/:realmName
router.delete('/:realmName', asyncHandler(async (req, res) => {
  await req.kc.deleteRealm(req.params.realmName);

  // Sync with local DB
  try {
    await Realm.destroy({ where: { realm_name: req.params.realmName } });
  } catch (dbError) {
    console.warn('Failed to delete realm from local DB:', dbError.message);
  }

  return ResponseHandler.noContent(res, 'Realm deleted successfully');
}));

module.exports = router;
