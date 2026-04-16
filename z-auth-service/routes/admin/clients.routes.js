
// routes/clients.route.js
const express = require('express');
const Joi = require('joi');
const asyncHandler = require('../../middleware/asyncHandler');
const { authMiddleware, requireSuperAdmin } = require('../../middleware/authMiddleware');
const withKeycloak = require('../../middleware/keycloak.middleware');
const { AppError } = require('../../middleware/errorHandler');
const ResponseHandler = require('../../utils/responseHandler');

const router = express.Router({ mergeParams: true }); // Important for accessing :realm param from parent

/* --------- Validation Schemas --------- */
const createClientSchema = Joi.object({
  clientId: Joi.string().min(3).max(100).required(),
  secret: Joi.string().min(10).max(255).optional(),
  redirectUris: Joi.array().items(Joi.string().uri()).min(1).required(),
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(255).optional(),
  enabled: Joi.boolean().optional().default(true),
  publicClient: Joi.boolean().optional().default(false),
  serviceAccountsEnabled: Joi.boolean().optional().default(true),
  standardFlowEnabled: Joi.boolean().optional().default(true),
  directAccessGrantsEnabled: Joi.boolean().optional().default(false),
  implicitFlowEnabled: Joi.boolean().optional().default(false),
  webOrigins: Joi.array().items(Joi.string().uri()).optional(),
  protocol: Joi.string().optional(),
  attributes: Joi.object().optional()
});

const updateClientSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(255).optional(),
  enabled: Joi.boolean().optional(),
  redirectUris: Joi.array().items(Joi.string().uri()).optional(),
  webOrigins: Joi.array().items(Joi.string().uri()).optional(),
  publicClient: Joi.boolean().optional(),
  serviceAccountsEnabled: Joi.boolean().optional(),
  standardFlowEnabled: Joi.boolean().optional(),
  directAccessGrantsEnabled: Joi.boolean().optional(),
  implicitFlowEnabled: Joi.boolean().optional(),
  protocol: Joi.string().optional(),
  attributes: Joi.object().optional()
}).min(1);

/* --------- Apply Middleware --------- */
router.use(authMiddleware); // Apply auth middleware if needed globally, or per route
router.use(withKeycloak);

/* --------- Routes --------- */

// GET /api/admin/:realm/clients
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const first = (parseInt(page) - 1) * parseInt(limit);
  const max = parseInt(limit);

  const [clients, totalCount] = await Promise.all([
    req.kc.getClients({ first, max, search }),
    req.kc.countClients()
  ]);

  const sanitizedClients = clients.map(client => ({
    id: client.id,
    clientId: client.clientId,
    name: client.name,
    description: client.description,
    enabled: client.enabled,
    publicClient: client.publicClient,
    redirectUris: client.redirectUris,
    webOrigins: client.webOrigins,
    serviceAccountsEnabled: client.serviceAccountsEnabled,
    standardFlowEnabled: client.standardFlowEnabled,
    directAccessGrantsEnabled: client.directAccessGrantsEnabled,
    implicitFlowEnabled: client.implicitFlowEnabled,
    protocol: client.protocol,
    realm: client.realm || req.kc.realm,
  }));

  return ResponseHandler.paginated(res, sanitizedClients, page, limit, totalCount, 'Clients retrieved successfully');
}));

// POST /api/admin/:realm/clients
router.post('/', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { error, value } = createClientSchema.validate(req.body);
  if (error) throw new AppError(error.message, 400, 'VALIDATION_ERROR');

  await req.kc.createClient(value);
  return ResponseHandler.created(res, null, 'Client created successfully');
}));

// GET /api/admin/:realm/clients/:clientId
router.get('/:clientId', asyncHandler(async (req, res) => {
  const client = await req.kc.getClientById(req.params.clientId);
  delete client.secret; // Don't expose secret in get
  return ResponseHandler.success(res, client, 'Client details retrieved successfully');
}));

// PATCH /api/admin/:realm/clients/:clientId
router.patch('/:clientId', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { error, value } = updateClientSchema.validate(req.body);
  if (error) throw new AppError(error.message, 400, 'VALIDATION_ERROR');

  await req.kc.updateClient(req.params.clientId, value);
  return ResponseHandler.success(res, { clientId: req.params.clientId }, 'Client updated successfully');
}));

// DELETE /api/admin/:realm/clients/:clientId
router.delete('/:clientId', requireSuperAdmin(), asyncHandler(async (req, res) => {
  await req.kc.deleteClient(req.params.clientId);
  return ResponseHandler.noContent(res, 'Client deleted successfully');
}));

// GET /api/admin/:realm/clients/:clientId/secret
router.get('/:clientId/secret', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const secret = await req.kc.getClientSecret(req.params.clientId);
  return ResponseHandler.success(res, secret, 'Client secret retrieved successfully');
}));

// POST /api/admin/:realm/clients/:clientId/secret/regenerate
router.post('/:clientId/secret/regenerate', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const secret = await req.kc.regenerateClientSecret(req.params.clientId);
  return ResponseHandler.success(res, secret, 'Client secret regenerated successfully');
}));

// GET /api/admin/:realm/clients/:clientId/roles
router.get('/:clientId/roles', asyncHandler(async (req, res) => {
  const roles = await req.kc.getClientRoles(req.params.clientId);
  return ResponseHandler.success(res, roles, 'Client roles retrieved successfully');
}));

// POST /api/admin/:realm/clients/:clientId/roles
router.post('/:clientId/roles', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { roleName, name, description } = req.body;
  const finalRoleName = roleName || name;
  if (!finalRoleName) throw new AppError('roleName is required', 400, 'VALIDATION_ERROR');

  const role = await req.kc.createClientRole(req.params.clientId, finalRoleName, description);
  return ResponseHandler.created(res, role, 'Client role created successfully');
}));

// GET /api/admin/:realm/clients/:clientId/roles/:roleName
router.get('/:clientId/roles/:roleName', asyncHandler(async (req, res) => {
  const role = await req.kc.getClientRole(req.params.clientId, req.params.roleName);
  return ResponseHandler.success(res, role, 'Client role retrieved successfully');
}));

// PATCH /api/admin/:realm/clients/:clientId/roles/:roleName
router.patch('/:clientId/roles/:roleName', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const role = await req.kc.updateClientRole(req.params.clientId, req.params.roleName, req.body);
  return ResponseHandler.success(res, role, 'Client role updated successfully');
}));

// DELETE /api/admin/:realm/clients/:clientId/roles/:roleName
router.delete('/:clientId/roles/:roleName', requireSuperAdmin(), asyncHandler(async (req, res) => {
  await req.kc.deleteClientRole(req.params.clientId, req.params.roleName);
  return ResponseHandler.noContent(res, 'Client role deleted successfully');
}));

module.exports = router;
