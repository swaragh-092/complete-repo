'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true }); // Important for nested routes like /organizations/:id/requests
const RequestService = require('../services/request.service');
const { authMiddleware, requireSuperAdmin } = require('../../../middleware/authMiddleware');
const asyncHandler = require('../../../middleware/asyncHandler');
const ResponseHandler = require('../../../utils/responseHandler');
const { createRequestSchema, resolveRequestSchema } = require('../validators/requests.validator');

// Must be authenticated for all request endpoints
router.use(authMiddleware);

/**
 * GET /api/organizations/requests
 * Fetch all pending and resolved requests (Super Admin Only)
 * NOTE: When mounted directly at /api/organizations/requests, mergeParams won't affect this.
 */
router.get('/', requireSuperAdmin, asyncHandler(async (req, res) => {
    // Optional filtering (status=pending, etc.)
    const filters = {};
    if (req.query.status) filters.status = req.query.status;

    const requests = await RequestService.getAllRequests(filters);
    return ResponseHandler.success(res, requests, 'All organization requests retrieved');
}));

/**
 * POST /api/organizations/:id/requests
 * Submit a new limit increase or feature request for the organization
 */
router.post('/', asyncHandler(async (req, res) => {
    // Validate org ID is present due to nested routing
    const orgId = req.params.id;
    if (!orgId) {
        return ResponseHandler.error(res, 'Organization ID is required', 400);
    }

    const { error, value } = createRequestSchema.validate(req.body);
    if (error) return ResponseHandler.error(res, error.details[0].message, 400);

    const newRequest = await RequestService.createRequest(orgId, req.user.id, value);
    return ResponseHandler.success(res, newRequest, 'Organization request submitted successfully', 201);
}));

/**
 * GET /api/organizations/:id/requests
 * Get all requests for a specific organization
 */
router.get('/:id/requests', asyncHandler(async (req, res) => {
    // Either Super Admin, or org admin (authorization checked at business logic/middleware layer ideally)
    // For now, simpler: user must just be authenticated. Proper RBAC can be applied via middleware.

    const filters = {};
    if (req.query.status) filters.status = req.query.status;

    const requests = await RequestService.getOrgRequests(req.params.id, filters);
    return ResponseHandler.success(res, requests, 'Organization requests retrieved successfully');
}));

/**
 * PATCH /api/organizations/requests/:requestId/resolve
 * Approve or reject a request (Super Admin Only)
 */
router.patch('/:requestId/resolve', requireSuperAdmin, asyncHandler(async (req, res) => {
    const { error, value } = resolveRequestSchema.validate(req.body);
    if (error) return ResponseHandler.error(res, error.details[0].message, 400);

    const resolvedRequest = await RequestService.resolveRequest(
        req.params.requestId,
        value.status,
        req.user.id,
        value.reason
    );

    return ResponseHandler.success(res, resolvedRequest, `Organization request ${value.status} successfully`);
}));

module.exports = router;
