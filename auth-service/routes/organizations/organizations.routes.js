// routes/organizations.route.js - Organizations CRUD

const express = require('express');
const logger = require('../../utils/logger');
const Joi = require('joi');
const asyncHandler = require('../../middleware/asyncHandler');
const { authMiddleware, requireSuperAdmin, requireRole } = require('../../middleware/authMiddleware');
const { AppError } = require('../../middleware/errorHandler');
const {
  Organization,
  UserMetadata,
  OrganizationMembership,
  Role,
  Client,
  AuditLog,
  sequelize,
  Sequelize


} = require('../../config/database');
const emailModule = require('../../services/email-client');

const ResponseHandler = require('../../utils/responseHandler');
const AuditService = require('../../services/audit.service');

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);

/* --------- Validation Schemas --------- */
const createOrganizationSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  tenant_id: Joi.string().max(50).optional(),
  description: Joi.string().max(500).optional().allow(null, '')
});

const updateOrganizationSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  tenant_id: Joi.string().max(50).optional(),
  description: Joi.string().max(500).optional().allow(null, '')
}).min(1);

/* --------- ORGANIZATIONS CRUD ROUTES --------- */

// GET /api/organizations - Get all organizations
router.get('/', asyncHandler(async (req, res) => {
  const { tenant_id } = req.query;

  logger.info('📋 Fetching organizations with filters:', { tenant_id });

  try {
    const whereClause = {};
    if (tenant_id) whereClause.tenant_id = tenant_id;

    const organizations = await Organization.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    // Enrich with member counts
    const enrichedOrganizations = await Promise.all(organizations.map(async (org) => {
      const memberCount = await OrganizationMembership.count({
        where: { org_id: org.id }
      });

      const primaryUserCount = await UserMetadata.count({
        where: { org_id: org.id }
      });

      return {
        id: org.id,
        name: org.name,
        tenant_id: org.tenant_id,
        created_at: org.created_at,
        updated_at: org.updated_at,
        member_count: memberCount,
        primary_user_count: primaryUserCount,
        total_users: memberCount + primaryUserCount
      };
    }));

    logger.info(`✅ Retrieved ${enrichedOrganizations.length} organizations`);
    logger.info(`✅ Retrieved ${enrichedOrganizations.length} organizations`);
    return ResponseHandler.success(res, enrichedOrganizations, 'Organizations retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('❌ Failed to fetch organizations:', error);
    throw new AppError('Failed to retrieve organizations', 500, 'FETCH_FAILED');
  }
}));

// GET /api/organizations/:id - Get specific organization
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  logger.info('🔍 Fetching organization:', id);

  try {
    const organization = await Organization.findByPk(id);

    if (!organization) {
      throw new AppError('Organization not found', 404, 'NOT_FOUND');
    }

    // Get members with their roles
    const memberships = await OrganizationMembership.findAll({
      where: { org_id: organization.id },
      include: [
        {
          model: UserMetadata,
          as: 'UserMetadata',
          attributes: ['id', 'email', 'keycloak_id', 'designation', 'department']
        },
        {
          model: Role,
          as: 'Role',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    // Get primary users (users who have this as their primary org)
    const primaryUsers = await UserMetadata.findAll({
      where: { org_id: organization.id },
      attributes: ['id', 'email', 'keycloak_id', 'designation', 'department']
    });

    // Identify current user's role
    const currentUserId = req.user.id || req.user.sub || req.user.UserMetadata?.id;
    const currentUserMembership = memberships.find(m => m.UserMetadata.id === currentUserId);
    // If not found in memberships, check primary users if logic dictates (usually primary users are implicitly members/owners)
    // For now assuming membership table holds the truth for roles.

    const enrichedOrganization = {
      id: organization.id,
      name: organization.name,
      tenant_id: organization.tenant_id,
      created_at: organization.created_at,
      updated_at: organization.updated_at,
      current_user_role: currentUserMembership ? currentUserMembership.Role.name : null, // Added for UI permission checks
      members: memberships.map(m => ({
        user_id: m.UserMetadata.id,
        email: m.UserMetadata.email,
        keycloak_id: m.UserMetadata.keycloak_id,
        designation: m.UserMetadata.designation,
        department: m.UserMetadata.department,
        role: {
          id: m.Role.id,
          name: m.Role.name,
          description: m.Role.description
        },
        membership_type: 'member'
      })),
      primary_users: primaryUsers.map(user => ({
        user_id: user.id,
        email: user.email,
        keycloak_id: user.keycloak_id,
        designation: user.designation,
        department: user.department,
        membership_type: 'primary'
      })),
      member_count: memberships.length,
      primary_user_count: primaryUsers.length,
      total_users: memberships.length + primaryUsers.length
    };

    logger.info('✅ Organization details retrieved');
    logger.info('✅ Organization details retrieved');
    return ResponseHandler.success(res, enrichedOrganization, 'Organization details retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('❌ Failed to fetch organization:', error);
    throw new AppError('Failed to retrieve organization', 500, 'FETCH_FAILED');
  }
}));

// POST /api/organizations - Create new organization
/**
 * POST /api/organizations
 * Create a new organization with full validation and membership assignment
 */
router.post('/', asyncHandler(async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    logger.info('➕ Creating organization with data:', req.body);

    // ============================================================================
    // STEP 1: Validate Input
    // ============================================================================
    const { error, value } = createOrganizationSchema.validate(req.body);
    if (error) {
      await transaction.rollback();
      throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
    }

    const { name, tenant_id, description } = value;

    // ============================================================================
    // STEP 2: Get Authenticated User
    // ============================================================================
    // Use keycloak_id which is always set by authMiddleware, not sub which may be null
    const keycloakId = req.user?.keycloak_id;
    if (!keycloakId) {
      await transaction.rollback();
      throw new AppError('User authentication required', 401, 'UNAUTHORIZED');
    }

    const user = await UserMetadata.findOne({
      where: { keycloak_id: keycloakId }
    });

    if (!user) {
      await transaction.rollback();
      throw new AppError('User profile not found', 404, 'NOT_FOUND');
    }

    logger.info('✓ User validated:', user.email);

    // ============================================================================
    // STEP 3: Check Organization Limits
    // ============================================================================
    // Get client configuration to check organization model
    const clientId = req.user?.azp || req.user?.client_id;
    const client = await Client.findOne({
      where: { client_key: clientId }
    });

    if (client && client.organization_model === 'single') {
      // Check if user already has an organization
      const existingMembership = await OrganizationMembership.findOne({
        where: {
          user_id: user.id,
          status: 'active'
        }
      });

      if (existingMembership) {
        await transaction.rollback();
        throw new AppError('You can only belong to one organization at a time', 409, 'ORGANIZATION_LIMIT_REACHED');
      }
    }

    // ============================================================================
    // STEP 4: Check Email Domain (for company emails)
    // ============================================================================
    const emailDomain = user.email.split('@')[1];
    const isCompanyEmail = !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(emailDomain);

    if (isCompanyEmail) {
      // Check if organization with this domain already exists
      const existingOrgWithDomain = await Organization.findOne({
        where: {
          name: {
            [Sequelize.Op.iLike]: `%${emailDomain}%`
          }
        }
      });

      if (existingOrgWithDomain) {
        logger.warn(`⚠️ User attempting to create duplicate org for domain: ${emailDomain}`);
      }
    }

    // ============================================================================
    // STEP 5: Check Organization Name Uniqueness
    // ============================================================================
    const existingOrg = await Organization.findOne({
      where: {
        name: {
          [Sequelize.Op.iLike]: name  // Case-insensitive check
        }
      }
    });

    logger.info('✓ Organization name uniqueness checked', existingOrg);


    if (existingOrg) {
      await transaction.rollback();
      throw new AppError(`Organization name '${name}' is already taken`, 409, 'CONFLICT');
    }

    // ============================================================================
    // STEP 6: Generate Truly Unique tenant_id
    // ============================================================================

    const generateUniqueTenantId = async (orgName) => {
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        // Create a unique ID
        const baseId = orgName.toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .substring(0, 15);  // Shorter base

        const timestamp = Date.now().toString(36);  // Base-36 timestamp
        const random = Math.random().toString(36).substring(2, 8);  // 6 random chars

        const candidateTenantId = `${baseId}-${timestamp}-${random}`;

        // ✅ CHECK if this tenant_id already exists
        const existing = await Organization.findOne({
          where: { tenant_id: candidateTenantId }
        });

        if (!existing) {
          logger.info(`✓ Generated unique tenant_id: ${candidateTenantId}`);
          return candidateTenantId;
        }

        logger.warn(`⚠️ tenant_id collision detected, retrying... (attempt ${attempts + 1})`);
        attempts++;
      }

      // Fallback: use UUID if all attempts fail
      const uuid = require('uuid').v4();
      const fallbackId = `${orgName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10)}-${uuid}`;
      logger.info(`✓ Using fallback tenant_id: ${fallbackId}`);
      return fallbackId;
    };

    // Generate the tenant_id
    const generatedTenantId = await generateUniqueTenantId(name);


    // ============================================================================
    // ✅ STEP 6.5: CREATE THE ORGANIZATION (THIS WAS MISSING!)
    // ============================================================================
    logger.info('➕ Creating organization with:', {
      name: name.trim(),
      tenant_id: generatedTenantId,
      description: description?.trim()
    });

    const newOrganization = await Organization.create({
      name: name.trim(),
      tenant_id: generatedTenantId,
      description: description?.trim() || null,
      status: 'active',
      provisioned: false,
      settings: {
        created_by: user.id,
        created_via: 'self_service',
        email_domain: emailDomain,
        initial_member_count: 1,
        client_key: clientId
      }
    }, { transaction });

    logger.info('✅ Organization created:', {
      id: newOrganization.id,
      name: newOrganization.name,
      tenant_id: newOrganization.tenant_id
    });

    // ============================================================================
    // STEP 7: Get or Create 'Owner' Role
    // ============================================================================
    let ownerRole = await Role.findOne({
      where: { name: 'Owner' }
    });

    if (!ownerRole) {
      ownerRole = await Role.create({
        name: 'Owner',
        description: 'Organization owner with full administrative rights',
        permissions: JSON.stringify([
          'org:delete',
          'org:update',
          'members:invite',
          'members:remove',
          'members:update_roles',
          'settings:update',
          'billing:manage'
        ])
      }, { transaction });
      logger.info('✓ Owner role created');
    }

    // ============================================================================
    // STEP 8: Create Organization Membership (User becomes Owner)
    // ============================================================================
    const membership = await OrganizationMembership.create({
      user_id: user.id,
      org_id: newOrganization.id,
      role_id: ownerRole.id,
      status: 'active',
      is_primary: true,  // First org becomes primary
      joined_at: new Date()
    }, { transaction });

    logger.info('✅ Membership created:', membership.id);

    // ============================================================================
    // STEP 9: Update User's Organization Reference
    // ============================================================================
    await user.update({
      org_id: newOrganization.id,
      primary_org_id: newOrganization.id
    }, { transaction });

    logger.info('✅ User updated with organization reference');

    // ============================================================================
    // STEP 10: Create Audit Log Entry
    // ============================================================================
    await AuditService.log({
      action: 'ORGANIZATION_CREATED',
      userId: user.id,
      orgId: newOrganization.id,
      sourceIP: req.ip,
      userAgent: req.get('User-Agent'),
      affectedEntityType: 'organization',
      affectedEntityId: newOrganization.id,
      metadata: {
        organization_name: name,
        created_via: 'self_service_onboarding',
        client_id: clientId,
        email_domain: emailDomain
      }
    });

    // ============================================================================
    // STEP 11: Commit Transaction
    // ============================================================================
    await transaction.commit();

    logger.info('✅ Organization creation completed successfully');

    // ============================================================================
    // STEP 12: Send Welcome Email (async, don't wait) and Response
    // ============================================================================
    setImmediate(async () => {
      try {
        await emailModule.send({
          type: emailModule.EMAIL_TYPES.ORGANIZATION_CREATED,
          to: user.email,
          data: {
            userName: user.name || user.email,
            organizationName: name,
            role: 'Owner',
            dashboardUrl: `${process.env.APP_URL}/dashboard`,
            inviteUrl: `${process.env.APP_URL}/dashboard/invite`
          }
        });
        logger.info('✓ Welcome email sent');
      } catch (emailErr) {
        logger.error('⚠️ Failed to send welcome email:', emailErr);
      }
    });

    return ResponseHandler.created(res, {
      message: 'Organization created successfully',
      organization: {
        id: newOrganization.id,
        name: newOrganization.name,
        tenant_id: newOrganization.tenant_id,
        description: newOrganization.description,
        status: newOrganization.status,
        created_at: newOrganization.created_at,
        role: ownerRole.name,
        is_owner: true,
        member_count: 1,
        primary_user_count: 1,
        total_users: 1,
        settings: {
          email_domain: emailDomain,
          can_invite_members: true,
          max_members: client?.organization_model === 'enterprise' ? null : 50
        }
      },
      membership: {
        id: membership.id,
        role: ownerRole.name,
        is_primary: true,
        joined_at: membership.joined_at
      },
      next_steps: [
        'Invite team members',
        'Configure organization settings',
        'Set up billing (if required)'
      ]
    }, 'Organization created successfully');

  } catch (error) {
    // Only rollback if the transaction hasn't already been committed or rolled back
    if (!transaction.finished) {
      await transaction.rollback();
    }
    logger.error('❌ Organization creation failed:', error);

    // Handle specific errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('Organization name or tenant ID already exists', 409, 'CONFLICT');
    }

    if (error.name === 'SequelizeValidationError') {
      throw new AppError(error.errors.map(e => e.message).join(', '), 400, 'VALIDATION_ERROR');
    }

    if (error instanceof AppError) throw error;
    throw new AppError('An unexpected error occurred while creating the organization', 500, 'CREATION_FAILED');
  }
}));


// PUT /api/organizations/:id - Update organization
router.put('/:id', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { error, value } = updateOrganizationSchema.validate(req.body);

  if (error) {
    throw new AppError(error.details[0].message, 400, 'VALIDATION_ERROR');
  }

  const { id } = req.params;
  const { name, tenant_id } = value;

  logger.info('✏️ Updating organization:', id);

  try {
    const organization = await Organization.findByPk(id);

    if (!organization) {
      throw new AppError('Organization not found', 404, 'NOT_FOUND');
    }

    // Check if new name conflicts with existing organizations
    if (name && name !== organization.name) {
      const existingOrg = await Organization.findOne({
        where: {
          name,
          id: { [sequelize.Op.ne]: id } // Exclude current org
        }
      });

      if (existingOrg) {
        throw new AppError(`Organization name '${name}' already exists`, 409, 'CONFLICT');
      }
    }

    // Update organization
    const updateData = {};
    if (name) updateData.name = name;
    if (tenant_id !== undefined) updateData.tenant_id = tenant_id;

    await organization.update(updateData);

    logger.info('✅ Organization updated successfully');

    return ResponseHandler.success(res, {
      message: 'Organization updated successfully',
      organization: {
        id: organization.id,
        name: organization.name,
        tenant_id: organization.tenant_id,
        updated_at: organization.updated_at
      }
    }, 'Organization updated successfully');
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('❌ Organization update failed:', error);
    throw new AppError('Failed to update organization', 500, 'UPDATE_FAILED');
  }
}));

// DELETE /api/organizations/:id - Delete organization
router.delete('/:id', requireSuperAdmin(), asyncHandler(async (req, res) => {
  const { id } = req.params;

  logger.info('🗑️ Deleting organization:', id);

  try {
    const organization = await Organization.findByPk(id);

    if (!organization) {
      throw new AppError('Organization not found', 404, 'NOT_FOUND');
    }

    // Check if organization has members
    const memberCount = await OrganizationMembership.count({
      where: { org_id: organization.id }
    });

    const primaryUserCount = await UserMetadata.count({
      where: { org_id: organization.id }
    });

    if (memberCount > 0 || primaryUserCount > 0) {
      throw new AppError(`Cannot delete organization '${organization.name}' as it has ${memberCount + primaryUserCount} associated user(s)`, 400, 'ORGANIZATION_IN_USE');
    }

    // Delete the organization
    await organization.destroy();

    logger.info('✅ Organization deleted successfully');

    return ResponseHandler.success(res, {
      message: `Organization '${organization.name}' deleted successfully`
    }, 'Organization deleted successfully');
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('❌ Organization deletion failed:', error);
    throw new AppError('Failed to delete organization', 500, 'DELETION_FAILED');
  }
}));

// GET /api/organizations/:id/members - Get organization members
router.get('/:id/members', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role_name } = req.query;

  logger.info('👥 Fetching members for organization:', id);

  try {
    const organization = await Organization.findByPk(id);

    if (!organization) {
      throw new AppError('Organization not found', 404, 'NOT_FOUND');
    }

    // Build where clause for role filtering
    const includeRole = {
      model: Role,
      as: 'Role',
      attributes: ['id', 'name', 'description']
    };

    if (role_name) {
      includeRole.where = { name: role_name };
    }

    const memberships = await OrganizationMembership.findAll({
      where: { org_id: id },
      include: [
        {
          model: UserMetadata,
          as: 'UserMetadata',
          attributes: ['id', 'email', 'keycloak_id', 'designation', 'department', 'is_active']
        },
        includeRole
      ]
    });

    const members = memberships.map(m => ({
      membership_id: m.id,
      user: {
        id: m.UserMetadata.id,
        email: m.UserMetadata.email,
        keycloak_id: m.UserMetadata.keycloak_id,
        designation: m.UserMetadata.designation,
        department: m.UserMetadata.department,
        is_active: m.UserMetadata.is_active
      },
      role: {
        id: m.Role.id,
        name: m.Role.name,
        description: m.Role.description
      }
    }));

    logger.info(`✅ Retrieved ${members.length} members for organization ${organization.name}`);

    return ResponseHandler.success(res, {
      organization: {
        id: organization.id,
        name: organization.name
      },
      members,
      total_members: members.length
    }, 'Organization members retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('❌ Failed to fetch organization members:', error);
    throw new AppError('Failed to retrieve organization members', 500, 'FETCH_FAILED');
  }
}));

// GET /api/organizations/stats - Get organization statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
  logger.info('📊 Fetching organization statistics');

  try {
    const totalOrganizations = await Organization.count();

    // Organizations by tenant
    const tenantCounts = await Organization.findAll({
      attributes: [
        'tenant_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['tenant_id'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 10
    });

    // Organizations with most members
    const orgMemberCounts = await Organization.findAll({
      attributes: [
        'id',
        'name',
        [
          sequelize.fn('COUNT', sequelize.col('OrganizationMemberships.id')),
          'member_count'
        ]
      ],
      include: [
        {
          model: OrganizationMembership,
          attributes: [],
          required: false
        }
      ],
      group: ['Organization.id'],
      order: [[sequelize.literal('member_count'), 'DESC']],
      limit: 10
    });

    const stats = {
      total_organizations: totalOrganizations,
      by_tenant: tenantCounts.map(item => ({
        tenant_id: item.tenant_id || 'No Tenant',
        count: parseInt(item.dataValues.count)
      })),
      by_member_count: orgMemberCounts.map(item => ({
        id: item.id,
        name: item.name,
        member_count: parseInt(item.dataValues.member_count)
      }))
    };

    logger.info('✅ Organization statistics retrieved');
    logger.info('✅ Organization statistics retrieved');
    return ResponseHandler.success(res, stats, 'Organization statistics retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('❌ Failed to fetch organization statistics:', error);
    throw new AppError('Failed to retrieve organization statistics', 500, 'STATS_FAILED');
  }
}));

// GET /api/organizations/my - Get user's organizations
router.get('/my/organizations', asyncHandler(async (req, res) => {
  logger.info('👤 Fetching organizations for user:', req.user.id);

  try {
    // Get organizations where user is a member
    const memberships = await OrganizationMembership.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Organization,
          attributes: ['id', 'name', 'tenant_id']
        },
        {
          model: Role,
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    // Get primary organization
    const primaryOrganization = await Organization.findByPk(req.user.org_id);

    const myOrganizations = {
      primary_organization: primaryOrganization ? {
        id: primaryOrganization.id,
        name: primaryOrganization.name,
        tenant_id: primaryOrganization.tenant_id,
        membership_type: 'primary'
      } : null,
      member_organizations: memberships.map(m => ({
        id: m.Organization.id,
        name: m.Organization.name,
        tenant_id: m.Organization.tenant_id,
        role: {
          id: m.Role.id,
          name: m.Role.name,
          description: m.Role.description
        },
        membership_type: 'member'
      })),
      total_organizations: memberships.length + (primaryOrganization ? 1 : 0)
    };

    logger.info(`✅ Retrieved organizations for user`);
    logger.info(`✅ Retrieved organizations for user`);
    return ResponseHandler.success(res, myOrganizations, 'User organizations retrieved successfully');
  } catch (error) {
    logger.error('❌ Failed to fetch user organizations:', error);
    throw new AppError('Failed to retrieve user organizations', 500, 'FETCH_FAILED', { originalError: error.message });
  }
}));

module.exports = router;