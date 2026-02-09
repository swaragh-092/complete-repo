// routes/org-onboarding.js
// Organization onboarding API routes with comprehensive security and transaction handling

const express = require('express');
const Joi = require('joi');
const crypto = require('crypto');
const asyncHandler = require('../../middleware/asyncHandler');
const { authMiddleware, requireSuperAdmin } = require('../../middleware/authMiddleware');
const { AppError } = require('../../middleware/errorHandler');
const ResponseHandler = require('../../utils/responseHandler');
const {
  Organization,
  UserMetadata,
  OrganizationMembership,
  TenantMapping,
  Invitation,
  PendingInvitation,
  Role,
  Permission,
  AuditLog,
  sequelize
} = require('../../config/database');
const { Op } = require('sequelize');
const logger = require('../../utils/logger');
const { loadClients } = require('../../config');
const AuditService = require('../../services/audit.service');
const emailModule = require('../../modules/email');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/* --------- VALIDATION SCHEMAS --------- */

const createOrgSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  client_key: Joi.string().required(),
  description: Joi.string().max(500).optional(),
  settings: Joi.object().optional()
});

const joinOrgSchema = Joi.object({
  invitation_code: Joi.string().required()
});

const createInvitationSchema = Joi.object({
  org_id: Joi.string().uuid().required(),
  invited_email: Joi.string().email().required(),
  role_id: Joi.string().uuid().required(),
  expires_in_days: Joi.number().min(1).max(30).optional().default(7),
  message: Joi.string().max(500).optional()
});

const provisionOrgSchema = Joi.object({
  org_name: Joi.string().min(2).max(100).required(),
  owner_email: Joi.string().email().required(),
  role_id: Joi.string().uuid().optional(), // defaults to owner role
  description: Joi.string().max(500).optional()
});

/* --------- UTILITY FUNCTIONS --------- */

async function generateTenantId(orgName) {
  // Create URL-friendly tenant ID from org name
  let baseId = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Ensure uniqueness
  let tenantId = baseId;
  let counter = 1;

  while (await Organization.findOne({ where: { tenant_id: tenantId } })) {
    tenantId = `${baseId}-${counter}`;
    counter++;
  }

  return tenantId;
}

function generateInvitationCode() {
  return crypto.randomBytes(32).toString('hex');
}

function hashInvitationCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function getOwnerRole() {
  return await Role.findOne({ where: { name: 'owner' } });
}

/* --------- SELF-SERVICE ORG CREATION --------- */

router.post('/create', asyncHandler(async (req, res) => {
  const { error, value } = createOrgSchema.validate(req.body);
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

  const transaction = await sequelize.transaction();

  try {
    // 1. Check if organization name already exists
    const existingOrg = await Organization.findOne({
      where: { name },
      transaction
    });

    if (existingOrg) {
      await transaction.rollback();
      throw new AppError(`An organization with the name "${name}" already exists`, 409, 'ORGANIZATION_NAME_EXISTS');
    }

    // 2. Generate unique tenant ID
    const tenantId = await generateTenantId(name);

    // 3. Create organization
    const organization = await Organization.create({
      name,
      tenant_id: tenantId,
      status: 'active',
      provisioned: false,
      settings: settings || {}
    }, { transaction });

    logger.info('Organization created', {
      orgId: organization.id,
      orgName: name,
      tenantId
    });

    // 4. Get owner role
    const ownerRole = await getOwnerRole();
    if (!ownerRole) {
      throw new Error('Owner role not found in system');
    }

    // 5. Ensure user metadata exists
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

    // 6. Create organization membership (owner role)
    const membership = await OrganizationMembership.create({
      user_id: userMetadata.id,
      org_id: organization.id,
      role_id: ownerRole.id
    }, { transaction });

    logger.info('Organization membership created', {
      membershipId: membership.id,
      userId: userMetadata.id,
      orgId: organization.id,
      role: 'owner'
    });

    // 7. Create tenant mapping for multi-tenant support
    const tenantMapping = await TenantMapping.upsert({
      user_id: keycloakId,
      tenant_id: tenantId,
      client_key: client_key
    }, { transaction });

    logger.info('Tenant mapping created', {
      keycloakId,
      tenantId,
      clientKey: client_key
    });

    // 8. Set as user's primary organization if they don't have one
    if (!userMetadata.org_id) {
      await userMetadata.update({
        org_id: organization.id
      }, { transaction });
    }

    // 9. Create audit log
    await AuditService.log({
      action: 'ORG_CREATED_SELF_SERVICE',
      userId: userMetadata.id,
      orgId: organization.id,
      clientId: client.client_id,
      metadata: {
        org_name: name,
        tenant_id: tenantId,
        user_email: userEmail,
        client_key
      }
    });

    await transaction.commit();

    logger.info('Self-service organization creation completed successfully', {
      orgId: organization.id,
      orgName: name,
      tenantId,
      userId: userMetadata.id,
      userEmail
    });

    return ResponseHandler.created(res, {
      message: 'Organization created successfully',
      organization: {
        id: organization.id,
        name: organization.name,
        tenant_id: organization.tenant_id,
        status: organization.status,
        created_at: organization.created_at
      },
      membership: {
        id: membership.id,
        role: ownerRole.name,
        permissions: [] // Could fetch role permissions here if needed
      },
      tenant_mapping: {
        tenant_id: tenantId,
        client_key
      }
    }, 'Organization created successfully');

  } catch (error) {
    await transaction.rollback();
    logger.error('Self-service organization creation failed', {
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
  const { error, value } = joinOrgSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  }

  const { invitation_code } = value;
  const userId = req.user.id;
  const keycloakId = req.user.keycloak_id;
  const userEmail = req.user.email;
  const emailVerified = req.user.email_verified || false;

  logger.info('Organization join via invitation initiated', {
    userId,
    userEmail,
    emailVerified,
    invitationCode: invitation_code.substring(0, 8) + '...' // Log partial code for security
  });

  // Security check: require verified email
  if (!emailVerified) {
    throw new AppError('Your email address must be verified before joining an organization', 403, 'EMAIL_VERIFICATION_REQUIRED');
  }

  const codeHash = hashInvitationCode(invitation_code);
  const transaction = await sequelize.transaction();

  try {
    // 1. Find valid invitation
    const invitation = await Invitation.findOne({
      where: {
        code_hash: codeHash,
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

    if (!invitation) {
      await transaction.rollback();
      throw new AppError('Invitation code is invalid or has already been used', 404, 'INVALID_INVITATION');
    }

    // 2. Check invitation expiry
    if (invitation.expires_at && new Date() > invitation.expires_at) {
      await invitation.update({ status: 'expired' }, { transaction });
      await transaction.rollback();
      throw new AppError('This invitation has expired', 410, 'INVITATION_EXPIRED');
    }

    // 3. Verify email matches (security requirement)
    if (invitation.invited_email !== userEmail) {
      await transaction.rollback();
      logger.warn('Email mismatch in invitation', {
        invitedEmail: invitation.invited_email,
        userEmail,
        invitationId: invitation.id
      });
      throw new AppError('This invitation was sent to a different email address', 403, 'EMAIL_MISMATCH');
    }

    // 4. Ensure user metadata exists
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

    // 5. Check if user is already a member
    const existingMembership = await OrganizationMembership.findOne({
      where: {
        user_id: userMetadata.id,
        org_id: invitation.org_id
      },
      transaction
    });

    if (existingMembership) {
      await invitation.update({
        status: 'accepted',
        accepted_by: userMetadata.id,
        accepted_at: new Date()
      }, { transaction });

      await transaction.commit();

      return ResponseHandler.success(res, {
        message: 'You are already a member of this organization',
        organization: invitation.Organization,
        membership: {
          id: existingMembership.id,
          already_member: true
        }
      }, 'You are already a member of this organization');
    }

    // 6. Create organization membership
    const membership = await OrganizationMembership.create({
      user_id: userMetadata.id,
      org_id: invitation.org_id,
      role_id: invitation.role_id
    }, { transaction });

    logger.info('Organization membership created via invitation', {
      membershipId: membership.id,
      userId: userMetadata.id,
      orgId: invitation.org_id,
      roleId: invitation.role_id,
      roleName: invitation.Role.name
    });

    // 7. Mark invitation as accepted
    await invitation.update({
      status: 'accepted',
      accepted_by: userMetadata.id,
      accepted_at: new Date()
    }, { transaction });

    // 8. Create audit log
    await AuditService.log({
      action: 'ORG_JOINED_VIA_INVITATION',
      userId: userMetadata.id,
      orgId: invitation.org_id,
      metadata: {
        org_name: invitation.Organization.name,
        user_email: userEmail,
        role_name: invitation.Role.name,
        invitation_id: invitation.id,
        invited_by: invitation.invited_by
      }
    });

    await transaction.commit();

    logger.info('Organization join via invitation completed successfully', {
      orgId: invitation.org_id,
      orgName: invitation.Organization.name,
      userId: userMetadata.id,
      userEmail,
      role: invitation.Role.name
    });

    return ResponseHandler.success(res, {
      message: 'Successfully joined organization',
      organization: {
        id: invitation.Organization.id,
        name: invitation.Organization.name,
        tenant_id: invitation.Organization.tenant_id
      },
      membership: {
        id: membership.id,
        role: invitation.Role.name,
        joined_at: membership.created_at
      }
    }, 'Successfully joined organization');

  } catch (error) {
    await transaction.rollback();
    logger.error('Organization join via invitation failed', {
      error: error.message,
      stack: error.stack,
      userId,
      userEmail,
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
  const { error, value } = createInvitationSchema.validate(req.body);
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

  const transaction = await sequelize.transaction();

  try {
    // 1. Verify organization exists and is active
    const organization = await Organization.findByPk(org_id, { transaction });
    if (!organization) {
      throw new AppError('The specified organization does not exist', 404, 'ORGANIZATION_NOT_FOUND');
    }

    // 2. Verify role exists
    const role = await Role.findByPk(role_id, { transaction });
    if (!role) {
      throw new AppError('The specified role does not exist', 404, 'ROLE_NOT_FOUND');
    }

    // 3. Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      where: {
        org_id,
        invited_email,
        status: 'pending'
      },
      transaction
    });

    if (existingInvitation) {
      throw new AppError(`A pending invitation for ${invited_email} already exists for this organization`, 409, 'INVITATION_ALREADY_EXISTS');
    }

    // 4. Generate invitation code
    const invitationCode = generateInvitationCode();
    const codeHash = hashInvitationCode(invitationCode);

    // 5. Create invitation
    const invitation = await Invitation.create({
      org_id,
      invited_email,
      role_id,
      code_hash: codeHash,
      invited_by: userId,
      expires_at: new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000),
      status: 'pending'
    }, { transaction });

    // 6. Create audit log
    await AuditService.log({
      action: 'INVITATION_CREATED',
      userId: userId,
      orgId: org_id,
      metadata: {
        invitation_id: invitation.id,
        invited_email,
        role_name: role.name,
        expires_at: invitation.expires_at,
        created_by: userEmail
      }
    });

    await transaction.commit();

    // 7. Build invitation link
    const baseUrl = process.env.ACCOUNT_UI_URL || process.env.FRONTEND_URL || 'https://account.local.test:5174';
    const invitationLink = `${baseUrl}/join?code=${invitationCode}`;

    logger.info('Invitation created successfully', {
      invitationId: invitation.id,
      orgId: org_id,
      invitedEmail: invited_email,
      createdBy: userId
    });

    // 8. Send invitation email (non-blocking - don't fail if email fails)
    try {
      await emailModule.send({
        type: emailModule.EMAIL_TYPES.ORGANIZATION_INVITATION,
        to: invited_email,
        data: {
          organizationName: organization.name,
          inviterEmail: userEmail,
          inviterName: req.user.name || req.user.firstName || userEmail,
          roleName: role.name,
          invitationLink: invitationLink,
          expiresAt: invitation.expires_at,
          message: message || null,
          appName: process.env.APP_NAME || 'SSO Platform'
        }
      });
      logger.info('📧 Invitation email sent successfully to:', invited_email);
    } catch (emailError) {
      // Log error but don't fail the invitation creation
      logger.error('📧 Failed to send invitation email (invitation still created):', {
        error: emailError.message,
        invitedEmail: invited_email
      });
    }

    return ResponseHandler.created(res, {
      message: 'Invitation created successfully',
      invitation: {
        id: invitation.id,
        invited_email,
        organization: organization.name,
        role: role.name,
        expires_at: invitation.expires_at,
        status: invitation.status,
        invitation_link: invitationLink,
        created_at: invitation.created_at
      }
    }, 'Invitation created successfully');

  } catch (error) {
    // Only rollback if transaction is still active
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    logger.error('Invitation creation failed', {
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
  const { error, value } = provisionOrgSchema.validate(req.body);
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
      ownerRole = await getOwnerRole();
    }

    if (!ownerRole) {
      throw new Error('Owner role not found in system');
    }

    // 3. Generate unique tenant ID
    const tenantId = await generateTenantId(org_name);

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

module.exports = router;