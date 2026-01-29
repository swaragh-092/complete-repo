'use strict';

const express = require('express');
const router = express.Router();
const WorkspaceService = require('../services/workspace.service');
const { requireWorkspaceAccess, requireOrgPermission } = require('../middleware/workspaceMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');
const ResponseHandler = require('../utils/responseHandler');

// Import centralized validators
const {
    createWorkspaceSchema,
    updateWorkspaceSchema,
    addMemberSchema,
    updateMemberRoleSchema,
    workspaceInvitationSchema
} = require('../validators/workspace.validator');

// APPLY AUTH MIDDLEWARE TO ALL ROUTES
router.use(authMiddleware);

// --- Routes ---

/**
 * GET /api/workspaces
 * List all workspaces for the current user (optionally filtered by org_id)
 */
router.get('/', asyncHandler(async (req, res) => {
    const { org_id } = req.query;
    const workspaces = await WorkspaceService.getUserWorkspaces(req.user.id, org_id, req.user.roles);

    return ResponseHandler.success(res, workspaces);
}));

/**
 * POST /api/workspaces
 * Create a new workspace (requires org admin/owner role)
 */
router.post('/', requireOrgPermission('admin'), asyncHandler(async (req, res) => {
    const { error, value } = createWorkspaceSchema.validate(req.body);
    if (error) return ResponseHandler.error(res, error.details[0].message, 400);

    const workspace = await WorkspaceService.createWorkspace({
        userId: req.user.id,
        orgId: value.org_id,  // Map snake_case to camelCase
        name: value.name,
        slug: value.slug,
        description: value.description,
        userRoles: req.user.roles  // Pass user roles for super admin detection
    });

    return ResponseHandler.created(res, workspace);
}));

/**
 * GET /api/workspaces/:id
 * Get workspace details (Requires membership)
 */
router.get('/:id', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    // `requireWorkspaceAccess` attaches `req.workspace`
    return ResponseHandler.success(res, req.workspace);
}));

/**
 * POST /api/workspaces/:id/members
 * Add a member to the workspace (Requires Admin role)
 */
router.post('/:id/members', requireWorkspaceAccess('admin'), asyncHandler(async (req, res) => {
    const { error, value } = addMemberSchema.validate(req.body);
    if (error) return ResponseHandler.error(res, error.details[0].message, 400);

    const membership = await WorkspaceService.addMember({
        requesterId: req.user.id,
        workspaceId: req.params.id,
        targetUserId: value.user_id,
        role: value.role
    });

    return ResponseHandler.success(res, membership);
}));

/**
 * GET /api/workspaces/:id/members
 * List members (Requires Workspace Access)
 */
router.get('/:id/members', requireWorkspaceAccess(), asyncHandler(async (req, res) => {
    const members = await WorkspaceService.getMembers(req.params.id);
    return ResponseHandler.success(res, members);
}));

/**
 * DELETE /api/workspaces/:id/members/:userId
 * Remove member (Requires Admin)
 */
router.delete('/:id/members/:userId', requireWorkspaceAccess('admin'), asyncHandler(async (req, res) => {
    await WorkspaceService.removeMember({
        requesterId: req.user.id,
        workspaceId: req.params.id,
        targetUserId: req.params.userId
    });
    return ResponseHandler.success(res, { message: 'Member removed' });
}));

/**
 * PUT /api/workspaces/:id
 * Update workspace details (Requires Admin)
 */
router.put('/:id', requireWorkspaceAccess('admin'), asyncHandler(async (req, res) => {
    const { error, value } = updateWorkspaceSchema.validate(req.body);
    if (error) return ResponseHandler.error(res, error.details[0].message, 400);

    const workspace = await WorkspaceService.updateWorkspace({
        requesterId: req.user.id,
        workspaceId: req.params.id,
        ...value
    });

    return ResponseHandler.success(res, workspace);
}));

/**
 * DELETE /api/workspaces/:id
 * Soft delete workspace (Requires Admin)
 */
router.delete('/:id', requireWorkspaceAccess('admin'), asyncHandler(async (req, res) => {
    await WorkspaceService.deleteWorkspace({
        requesterId: req.user.id,
        workspaceId: req.params.id
    });

    return ResponseHandler.success(res, { message: 'Workspace deleted' });
}));

/**
 * PUT /api/workspaces/:id/members/:userId
 * Update member role (Requires Admin)
 */
router.put('/:id/members/:userId', requireWorkspaceAccess('admin'), asyncHandler(async (req, res) => {
    const { error, value } = updateMemberRoleSchema.validate(req.body);
    if (error) return ResponseHandler.error(res, error.details[0].message, 400);

    const membership = await WorkspaceService.updateMemberRole({
        requesterId: req.user.id,
        workspaceId: req.params.id,
        targetUserId: req.params.userId,
        newRole: value.role
    });

    return ResponseHandler.success(res, membership);
}));

// ============== INVITATION ROUTES ==============

/**
 * POST /api/workspaces/:id/invitations
 * Send workspace invitation (Requires Admin)
 */
router.post('/:id/invitations', requireWorkspaceAccess('admin'), asyncHandler(async (req, res) => {
    const { error, value } = workspaceInvitationSchema.validate(req.body);
    if (error) return ResponseHandler.error(res, error.details[0].message, 400);

    const invitation = await WorkspaceService.sendInvitation({
        requesterId: req.user.id,
        workspaceId: req.params.id,
        ...value
    });

    return ResponseHandler.created(res, invitation, 'Invitation sent successfully');
}));

/**
 * GET /api/workspaces/:id/invitations
 * List pending invitations (Requires Admin)
 */
router.get('/:id/invitations', requireWorkspaceAccess('admin'), asyncHandler(async (req, res) => {
    const invitations = await WorkspaceService.getInvitations(req.params.id);
    return ResponseHandler.success(res, invitations);
}));

/**
 * DELETE /api/workspaces/:id/invitations/:invitationId
 * Revoke invitation (Requires Admin)
 */
router.delete('/:id/invitations/:invitationId', requireWorkspaceAccess('admin'), asyncHandler(async (req, res) => {
    await WorkspaceService.revokeInvitation({
        requesterId: req.user.id,
        workspaceId: req.params.id,
        invitationId: req.params.invitationId
    });
    return ResponseHandler.success(res, { message: 'Invitation revoked' });
}));

// ============== PUBLIC INVITATION ROUTES ==============
// These routes require auth but NOT workspace admin access

/**
 * GET /api/workspaces/invitations/preview
 * Preview invitation details before accepting (requires auth)
 */
router.get('/invitations/preview', asyncHandler(async (req, res) => {
    const { code } = req.query;
    if (!code) return ResponseHandler.error(res, 'Invitation code is required', 400);

    const invitation = await WorkspaceService.getInvitationByCode(code);
    return ResponseHandler.success(res, invitation);
}));

/**
 * POST /api/workspaces/invitations/accept
 * Accept workspace invitation (requires auth)
 */
router.post('/invitations/accept', asyncHandler(async (req, res) => {
    const { code } = req.body;
    if (!code) return ResponseHandler.error(res, 'Invitation code is required', 400);

    const result = await WorkspaceService.acceptInvitation({
        code,
        userId: req.user.id
    });

    return ResponseHandler.success(res, result, 'Invitation accepted successfully');
}));

module.exports = router;
