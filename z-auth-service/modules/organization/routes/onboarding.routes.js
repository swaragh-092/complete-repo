// routes/org-onboarding.js
// Organization onboarding API routes with comprehensive security and transaction handling

const express = require('express');
const Joi = require('joi');
const crypto = require('crypto');
const asyncHandler = require('../../../middleware/asyncHandler');
const { authMiddleware, requireSuperAdmin } = require('../../../middleware/authMiddleware');
const logger = require('../../../utils/logger');
const { AppError } = require('../../../middleware/errorHandler');
const { createOrgSchema, joinOrgSchema, createInvitationSchema, provisionOrgSchema } = require('../validators');
const ResponseHandler = require('../../../utils/responseHandler');
const {
  Organization,
  UserMetadata,
  OrganizationMembership,
  Role,
  RolePermission,
  Permission,
  Workspace,
  WorkspaceMembership,
  sequelize,
  Client
} = require('../../../config/database');
const { Op } = require('sequelize');
const { loadClients } = require('../../../config');
const OrganizationService = require('../services/organization.service');
const InvitationService = require('../services/invitation.service');
const AuditService = require('../../../services/audit.service');
const emailModule = require('../../../services/email-client');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);



/* --------- UTILITY FUNCTIONS --------- */

function generateInvitationCode() {
  return crypto.randomBytes(32).toString('hex');
}

function hashInvitationCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/* --------- SELF-SERVICE ORG CREATION --------- */

router.post('/create', asyncHandler(async (req, res) => {
  const { error, value } = createOrgSchema.validate(req.body || {});
  if (error) {
    throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  }

  const { name, client_key, description, settings } = value;
  const userId = req.user.id;
  const keycloakId = req.user.keycloak_id;
  const userEmail = req.user.email;

  logger.info('Self-service organization creation initiated', {
    userId,
    userEmail,
    orgName: name,
    clientKey: client_key
  });

  // Verify client exists
  const clients = await loadClients();
  const client = clients[client_key];
  if (!client) {
    throw new AppError('Client not found', 400, 'INVALID_CLIENT');
  }

  try {
    // Delegate to business service
    const result = await OrganizationService.createOrganization({
      name,
      description,
      settings,
      user: {
        keycloak_id: keycloakId,
        email: userEmail
      },
      client_key: client_key,
      isProvision: false,
      req // pass request for audit logs
    });

    // Create audit log
    await AuditService.log({
      action: 'ORG_CREATED_SELF_SERVICE',
      userId: result.membership.user_id,
      orgId: result.organization.id,
      clientId: client.client_id,
      metadata: {
        org_name: name,
        tenant_id: result.tenantId,
        user_email: userEmail,
        client_key
      }
    });

    logger.info('Self-service organization creation completed successfully', {
      orgId: result.organization.id,
      orgName: name,
      tenantId: result.tenantId,
      userId: result.membership.user_id,
      userEmail
    });

    return ResponseHandler.created(res, {
      message: 'Organization created successfully',
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        tenant_id: result.organization.tenant_id,
        status: result.organization.status,
        created_at: result.organization.created_at
      },
      membership: {
        id: result.membership.id,
        role: result.ownerRole.name,
        permissions: [] // Could fetch role permissions here if needed
      },
      tenant_mapping: {
        tenant_id: result.tenantId,
        client_key
      }
    }, 'Organization created successfully');

  } catch (error) {
    logger.error('❌ Self-service organization creation failed', {
      error: error.message,
      stack: error.stack,
      userId,
      userEmail,
      orgName: name
    });

    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create organization. Please try again.', 500, 'ORGANIZATION_CREATION_FAILED');
  }
}));

/* --------- JOIN VIA INVITATION --------- */

router.post('/join', asyncHandler(async (req, res) => {
  const { error, value } = joinOrgSchema.validate(req.body || {});
  if (error) {
    throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  }

  const { invitation_code } = value;
  const user = {
    id: req.user.id,
    keycloak_id: req.user.keycloak_id,
    email: req.user.email
  };
  const emailVerified = req.user.email_verified || false;

  logger.info('Organization join via invitation initiated', {
    userId: user.id,
    userEmail: user.email,
    emailVerified,
    invitationCode: invitation_code.substring(0, 8) + '...' // Log partial code for security
  });

  // Security check: require verified email
  if (!emailVerified) {
    throw new AppError('Your email address must be verified before joining an organization', 403, 'EMAIL_VERIFICATION_REQUIRED');
  }

  try {
    const result = await InvitationService.acceptOrganizationInvite({
      invitation_code,
      user
    });

    if (result.already_member) {
      return ResponseHandler.success(res, {
        message: 'You are already a member of this organization',
        organization: result.organization,
        membership: {
          id: result.membership.id,
          already_member: true
        }
      }, 'You are already a member of this organization');
    }

    logger.info('Organization join via invitation completed successfully', {
      orgId: result.organization.id,
      orgName: result.organization.name,
      userId: user.id,
      userEmail: user.email,
      role: result.role.name
    });

    return ResponseHandler.success(res, {
      message: 'Successfully joined organization',
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        tenant_id: result.organization.tenant_id
      },
      membership: {
        id: result.membership.id,
        role: result.role.name,
        joined_at: result.membership.created_at
      }
    }, 'Successfully joined organization');

  } catch (error) {
    logger.error('❌ Organization join via invitation failed', {
      error: error.message,
      stack: error.stack,
      userId: user.id,
      userEmail: user.email,
      invitationCode: invitation_code.substring(0, 8) + '...'
    });

    if (error instanceof AppError) throw error;
    throw new AppError('Failed to join organization. Please try again.', 500, 'JOIN_ORGANIZATION_FAILED');
  }
}));

/* --------- ACCEPT PENDING INVITATION --------- */

router.post('/accept-pending', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const keycloakId = req.user.keycloak_id;
  const userEmail = req.user.email;
  const emailVerified = req.user.email_verified || false;

  logger.info('Accept pending invitation initiated', {
    userId,
    userEmail,
    emailVerified
  });

  // Security check: require verified email
  if (!emailVerified) {
    throw new AppError('Your email address must be verified before accepting invitations', 403, 'EMAIL_VERIFICATION_REQUIRED');
  }

  const transaction = await sequelize.transaction();

  try {
    // 1. Find pending invitation
    const pendingInvitation = await PendingInvitation.findOne({
      where: {
        email: userEmail,
        status: 'pending'
      },
      include: [
        {
          model: Organization,
          attributes: ['id', 'name', 'tenant_id', 'status']
        },
        {
          model: Role,
          attributes: ['id', 'name', 'description']
        }
      ],
      transaction
    });

    if (!pendingInvitation) {
      await transaction.rollback();
      throw new AppError('No pending invitation found for your email address', 404, 'NO_PENDING_INVITATION');
    }

    // 2. Ensure user metadata exists
    let userMetadata = await UserMetadata.findOne({
      where: { keycloak_id: keycloakId },
      transaction
    });

    if (!userMetadata) {
      userMetadata = await UserMetadata.create({
        keycloak_id: keycloakId,
        email: userEmail,
        is_active: true,
        last_login: new Date()
      }, { transaction });
    }

    // 3. Check if user is already a member
    const existingMembership = await OrganizationMembership.findOne({
      where: {
        user_id: userMetadata.id,
        org_id: pendingInvitation.org_id
      },
      transaction
    });

    if (!existingMembership) {
      // 4. Create organization membership
      const membership = await OrganizationMembership.create({
        user_id: userMetadata.id,
        org_id: pendingInvitation.org_id,
        role_id: pendingInvitation.role_id
      }, { transaction });

      logger.info('Organization membership created from pending invitation', {
        membershipId: membership.id,
        userId: userMetadata.id,
        orgId: pendingInvitation.org_id,
        roleId: pendingInvitation.role_id
      });
    }

    // 5. Set as user's primary organization if they don't have one
    if (!userMetadata.org_id) {
      await userMetadata.update({
        org_id: pendingInvitation.org_id
      }, { transaction });
    }

    // 6. Update organization status to active
    await Organization.update(
      { status: 'active' },
      {
        where: { id: pendingInvitation.org_id },
        transaction
      }
    );

    // 7. Mark pending invitation as accepted
    await pendingInvitation.update({
      status: 'accepted',
      accepted_at: new Date()
    }, { transaction });

    // 8. Create audit log
    await AuditService.log({
      action: 'PENDING_INVITATION_ACCEPTED',
      userId: userMetadata.id,
      orgId: pendingInvitation.org_id,
      metadata: {
        org_name: pendingInvitation.Organization.name,
        user_email: userEmail,
        role_name: pendingInvitation.Role.name,
        pending_invitation_id: pendingInvitation.id
      }
    });

    await transaction.commit();

    logger.info('Pending invitation acceptance completed successfully', {
      orgId: pendingInvitation.org_id,
      orgName: pendingInvitation.Organization.name,
      userId: userMetadata.id,
      userEmail,
      role: pendingInvitation.Role.name
    });

    return ResponseHandler.success(res, {
      message: 'Successfully accepted organization invitation',
      organization: {
        id: pendingInvitation.Organization.id,
        name: pendingInvitation.Organization.name,
        tenant_id: pendingInvitation.Organization.tenant_id
      },
      membership: {
        role: pendingInvitation.Role.name,
        accepted_at: new Date()
      }
    }, 'Successfully accepted organization invitation');

  } catch (error) {
    await transaction.rollback();
    logger.error('Pending invitation acceptance failed', {
      error: error.message,
      stack: error.stack,
      userId,
      userEmail
    });

    if (error instanceof AppError) throw error;
    throw new AppError('Failed to accept invitation. Please try again.', 500, 'ACCEPT_INVITATION_FAILED');
  }
}));

/* --------- Get Invitations (List pending invitations for org) --------- */

router.get('/invitations', asyncHandler(async (req, res) => {
  const { org_id } = req.query;
  const userId = req.user.id;

  if (!org_id) {
    throw new AppError('org_id is required', 400, 'VALIDATION_ERROR');
  }

  // Verify user has access to this organization
  const membership = await OrganizationMembership.findOne({
    where: { user_id: userId, org_id }
  });

  if (!membership) {
    throw new AppError('Not a member of this organization', 403, 'FORBIDDEN');
  }

  // Fetch pending invitations for the organization
  const invitations = await Invitation.findAll({
    where: {
      org_id,
      status: 'pending',
      expires_at: { [Op.gt]: new Date() }
    },
    include: [
      { model: Role, attributes: ['id', 'name'] }
    ],
    order: [['created_at', 'DESC']]
  });

  // Build invitation links from stored code_hash (can't reconstruct original code)
  // Instead, store and use a publicly shareable token or just show the join URL pattern
  const baseUrl = process.env.ACCOUNT_UI_URL || 'https://account.local.test:5174';

  return ResponseHandler.success(res, {
    invitations: invitations.map(inv => ({
      id: inv.id,
      invited_email: inv.invited_email,
      role: inv.Role?.name || 'member',
      role_id: inv.role_id,
      status: inv.status,
      expires_at: inv.expires_at,
      created_at: inv.created_at,
      // Note: We can't reconstruct the original invitation link from hash
      // The link is only available at creation time
      invitation_link: null
    }))
  }, 'Pending invitations retrieved successfully');
}));

/* --------- Create Invitations (Admin/Owner) --------- */

router.post('/invitations', asyncHandler(async (req, res) => {
  const { error, value } = createInvitationSchema.validate(req.body || {});
  if (error) {
    throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  }

  const { org_id, invited_email, role_id, expires_in_days, message } = value;
  const userId = req.user.id;
  const userEmail = req.user.email;

  logger.info('Creating invitation', {
    orgId: org_id,
    invitedEmail: invited_email,
    roleId: role_id,
    createdBy: userId
  });

  // Check if user has permission to invite to this organization
  const canInvite = req.user.hasPermission('organization:invite', org_id) ||
    req.user.hasRole('owner', org_id) ||
    req.user.hasRole('admin', org_id) ||
    req.user.hasAnyRole(['superadmin']);

  if (!canInvite) {
    throw new AppError('You do not have permission to invite users to this organization', 403, 'PERMISSION_DENIED');
  }

  try {
    const result = await InvitationService.sendOrganizationInvite({
      org_id,
      invited_email,
      role_id,
      expires_in_days,
      message,
      user: {
        id: userId,
        email: userEmail,
        name: req.user.name || req.user.firstName || userEmail
      }
    });

    return ResponseHandler.created(res, {
      message: 'Invitation created successfully',
      invitation: {
        id: result.invitation.id,
        invited_email,
        organization: result.organization.name,
        role: result.role.name,
        expires_at: result.invitation.expires_at,
        status: result.invitation.status,
        invitation_link: result.invitationLink,
        created_at: result.invitation.created_at
      }
    }, 'Invitation created successfully');

  } catch (error) {
    logger.error('❌ Invitation creation failed', {
      error: error.message,
      stack: error.stack,
      orgId: org_id,
      invitedEmail: invited_email,
      createdBy: userId
    });

    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create invitation. Please try again.', 500, 'INVITATION_CREATION_FAILED');
  }
}));


/* --------- ADMIN PROVISIONED ORGANIZATION --------- */

router.post('/admin/provision', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { error, value } = provisionOrgSchema.validate(req.body || {});
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.details[0].message
    });
  }

  const { org_name, owner_email, role_id, description } = value;
  const adminUserId = req.user.id;
  const adminEmail = req.user.email;

  logger.info('Admin organization provisioning initiated', {
    adminUserId,
    adminEmail,
    orgName: org_name,
    ownerEmail: owner_email
  });

  const transaction = await sequelize.transaction();

  try {
    // We cannot use OrganizationService.createOrganization directly here
    // because provisioning creates a PendingInvitation instead of a direct Membership.
    // However, we CAN reuse the unique tenant generator to enforce single responsibility.

    // 1. Check if organization name already exists
    const existingOrg = await Organization.findOne({
      where: { name: org_name },
      transaction
    });

    if (existingOrg) {
      await transaction.rollback();
      throw new AppError(`An organization with the name "${org_name}" already exists`, 409, 'ORGANIZATION_NAME_EXISTS');
    }

    // 2. Get owner role (default if role_id not provided)
    let ownerRole;
    if (role_id) {
      ownerRole = await Role.findByPk(role_id, { transaction });
    } else {
      ownerRole = await Role.findOne({ where: { name: 'Owner' }, transaction });
    }

    if (!ownerRole) {
      throw new Error('Owner role not found in system');
    }

    // 3. Generate unique tenant ID (Delegating to shared service!)
    const tenantId = await OrganizationService.generateUniqueTenantId(org_name);

    // 4. Create organization in pending state
    const organization = await Organization.create({
      name: org_name,
      tenant_id: tenantId,
      status: 'pending',
      provisioned: true,
      settings: { description: description || '' }
    }, { transaction });

    logger.info('Provisioned organization created', {
      orgId: organization.id,
      orgName: org_name,
      tenantId,
      status: 'pending'
    });

    // 5. Create pending invitation for owner
    const pendingInvitation = await PendingInvitation.create({
      org_id: organization.id,
      email: owner_email,
      role_id: ownerRole.id,
      created_by: adminUserId,
      status: 'pending'
    }, { transaction });

    logger.info('Pending invitation created for organization owner', {
      pendingInvitationId: pendingInvitation.id,
      orgId: organization.id,
      ownerEmail: owner_email
    });

    // 6. Create audit log
    await AuditService.log({
      action: 'ORG_PROVISIONED_BY_ADMIN',
      userId: adminUserId,
      orgId: organization.id,
      metadata: {
        org_name,
        tenant_id: tenantId,
        owner_email,
        role_name: ownerRole.name,
        admin_email: adminEmail,
        pending_invitation_id: pendingInvitation.id
      }
    });

    await transaction.commit();

    logger.info('Admin organization provisioning completed successfully', {
      orgId: organization.id,
      orgName: org_name,
      tenantId,
      ownerEmail: owner_email,
      adminUserId
    });

    res.status(201).json({
      message: 'Organization provisioned successfully',
      organization: {
        id: organization.id,
        name: organization.name,
        tenant_id: organization.tenant_id,
        status: organization.status,
        provisioned: organization.provisioned,
        created_at: organization.created_at
      },
      pending_invitation: {
        id: pendingInvitation.id,
        owner_email,
        role: ownerRole.name,
        status: 'pending',
        instructions: 'The organization owner will be automatically added when they log in for the first time'
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error('Admin organization provisioning failed', {
      error: error.message,
      stack: error.stack,
      adminUserId,
      orgName: org_name,
      ownerEmail: owner_email
    });

    if (error instanceof AppError) throw error;
    throw new AppError('Failed to provision organization. Please try again.', 500, 'ORGANIZATION_PROVISIONING_FAILED');
  }
}));

/* --------- REVOKE INVITATION --------- */

router.delete('/invitations/:id', asyncHandler(async (req, res) => {
  const invitationId = req.params.id;
  const userId = req.user.id;
  const userEmail = req.user.email;

  logger.info('Invitation revocation requested', {
    invitationId,
    revokedBy: userId
  });

  // Check permission: only org owner/admin or superadmin can revoke
  const canRevoke = req.user.hasAnyRole(['superadmin']) ||
    req.user.hasRole('owner') ||
    req.user.hasRole('admin');

  if (!canRevoke) {
    throw new AppError('You do not have permission to revoke invitations', 403, 'PERMISSION_DENIED');
  }

  try {
    const result = await InvitationService.revokeInvitation({
      invitationId,
      user: {
        id: userId,
        email: userEmail
      }
    });

    return ResponseHandler.success(res, {
      message: 'Invitation revoked successfully',
      invitation: result.invitation
    }, 'Invitation revoked successfully');

  } catch (error) {
    logger.error('❌ Invitation revocation failed', {
      error: error.message,
      stack: error.stack,
      invitationId,
      revokedBy: userId
    });

    if (error instanceof AppError) throw error;
    throw new AppError('Failed to revoke invitation. Please try again.', 500, 'INVITATION_REVOCATION_FAILED');
  }
}));

module.exports = router;