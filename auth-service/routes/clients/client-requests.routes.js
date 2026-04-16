// auth-service/routes/clientRequests.js
const express = require('express');
const { Client, UserMetadata, ClientRequest, sequelize } = require('../../config/database');
const { notifyAdmins, notifyDeveloper } = require('../../services/notifications');
const emailModule = require('../../services/email-client');
const { authMiddleware } = require('../../middleware/authMiddleware')
const asyncHandler = require('../../middleware/asyncHandler');
const { AppError } = require('../../middleware/errorHandler');
const ResponseHandler = require('../../utils/responseHandler');
const crypto = require('crypto');
const logger = require('../../utils/logger');
const { APP_URL, getKeycloakService } = require('../../config');



// getKeycloakService is imported from config/index.js - uses cached instances

const router = express.Router();

router.post('/client-requests', asyncHandler(async (req, res) => {
  try {
    const {
      name,
      clientKey,
      redirectUrl,
      description,
      developerEmail,
      developerName,
      framework = 'React',
      purpose,
      requiresOrganization = false,
      organizationModel,
      organizationFeatures = [],
      onboardingFlow
    } = req.body;

    // Validate required fields
    if (!name || !clientKey || !redirectUrl) {
      throw new AppError('Missing required fields: name, clientKey, redirectUrl', 400, 'VALIDATION_ERROR');
    }

    // Get callback URL (from request or default)
    const callbackUrl = req.body.callbackUrl || `${APP_URL}/auth/callback/${clientKey}`;

    // Validate organization-specific fields if organization support is enabled
    if (requiresOrganization) {
      if (!organizationModel || !onboardingFlow) {
        throw new AppError('Organization support requires: organizationModel and onboardingFlow', 400, 'VALIDATION_ERROR');
      }

      const validModels = ['single', 'multi', 'workspace', 'enterprise'];
      const validFlows = ['create_org', 'invitation_only', 'domain_matching', 'flexible'];

      if (!validModels.includes(organizationModel)) {
        throw new AppError(`Invalid organizationModel. Must be one of: ${validModels.join(', ')}`, 400, 'VALIDATION_ERROR');
      }

      if (!validFlows.includes(onboardingFlow)) {
        throw new AppError(`Invalid onboardingFlow. Must be one of: ${validFlows.join(', ')}`, 400, 'VALIDATION_ERROR');
      }
    }

    // Check if client key already exists
    const existingClient = await Client.findOne({ where: { client_key: clientKey } });
    const existingRequest = await ClientRequest.findOne({ where: { client_key: clientKey } });

    if (existingClient || existingRequest) {
      throw new AppError('Client key already exists or is pending approval', 409, 'CONFLICT');
    }

    // Create the request with organization support
    const clientRequest = await ClientRequest.create({
      name,
      client_key: clientKey,
      redirect_url: redirectUrl,
      description,
      developer_email: developerEmail,
      developer_name: developerName,
      status: 'pending',
      requires_organization: requiresOrganization,
      organization_model: organizationModel,
      organization_features: organizationFeatures,
      onboarding_flow: onboardingFlow,
      metadata: {
        framework,
        purpose,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        callbackUrl,  // ✅ Store callback URL in metadata
        organizationConfig: {
          enabled: requiresOrganization,
          model: organizationModel,
          features: organizationFeatures,
          flow: onboardingFlow
        }
      }
    });

    await emailModule.send({
      type: emailModule.EMAIL_TYPES.CLIENT_REQUEST,
      to: clientRequest.developer_email,
      data: {
        adminName: 'Admin',
        clientName: clientRequest.name,
        clientKey: clientRequest.client_key,
        developerEmail: clientRequest.developer_email,
        redirectUrl: clientRequest.redirect_url,
        description: clientRequest.description,
        approveUrl: `${APP_URL}/admin/client-requests`
      }
    });

    return ResponseHandler.created(res, {
      message: 'Client registration request submitted successfully',
      request: {
        id: clientRequest.id,
        clientKey: clientRequest.client_key,
        status: clientRequest.status,
        requestedAt: clientRequest.requested_at,
        organizationSupport: {
          enabled: clientRequest.requires_organization,
          model: clientRequest.organization_model,
          features: clientRequest.organization_features,
          onboardingFlow: clientRequest.onboarding_flow
        }
      }
    }, 'Client registration request submitted successfully');

  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Client request error:', error);
    throw new AppError('Failed to submit client request', 500, 'CREATION_FAILED', { originalError: error.message });
  }
}));

// ✅ Get request status
router.get('/client-requests/:clientKey/status', asyncHandler(async (req, res) => {
  try {
    const { clientKey } = req.params;

    const request = await ClientRequest.findOne({
      where: { client_key: clientKey, },
      attributes: ['id', 'client_key', 'status', 'requested_at', 'approved_at', 'rejection_reason']
    });

    if (!request) {
      throw new AppError('Request not found', 404, 'NOT_FOUND');
    }

    return ResponseHandler.success(res, { request }, 'Request status retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to get request status', 500, 'FETCH_FAILED', { originalError: error.message });
  }
}));

// ✅ Admin: List pending requests
router.get('/admin/client-requests', asyncHandler(async (req, res) => {
  try {
    logger.info('Fetching client requests with status:', req.query.status);
    const { status = 'pending' } = req.query;

    const requests = await ClientRequest.findAll({
      where: status !== 'all' ? { status } : {},
      order: [['requested_at', 'DESC']],
    });

    logger.info('Fetched client requests:', requests.length);
    return ResponseHandler.success(res, { requests }, 'Client requests retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Failed to get client requests:', error);
    throw new AppError('Failed to get client requests', 500, 'FETCH_FAILED', { originalError: error.message });
  }
}));

// ✅ Admin: Approve request
router.post("/admin/client-requests/:id/approve",
  authMiddleware,
  asyncHandler(async (req, res) => {
    logger.info("onside approve route");

    const transaction = await sequelize.transaction();
    logger.info(`Approving client request with ID: ${req.params.id}`);

    try {
      const { id } = req.params;
      const adminId = req.user?.sub || null;

      logger.info(
        `Approving client request with ID: ${id} by admin: ${adminId}`
      );

      if (!adminId) {
        throw new Error("Authenticated admin ID not found");
      }

      // 1️⃣ Fetch the request
      const request = await ClientRequest.findByPk(id, { transaction });
      logger.info("Fetched request:", request);

      if (!request) {
        await transaction.rollback();
        throw new AppError('Request not found', 404, 'NOT_FOUND');
      }

      if (request.status !== "pending") {
        await transaction.rollback();
        throw new AppError('Request already processed', 400, 'INVALID_STATUS');
      }

      // 2️⃣ Generate a secure secret
      const clientSecret = crypto.randomBytes(32).toString("hex");

      // Use the authenticated admin's ID
      const adminUser = await UserMetadata.findOne({
        where: {
          keycloak_id: adminId, // Use the ID from the token (req.user.sub)
        },
      });

      logger.info("Admin user:", adminUser);

      if (!adminUser) throw new AppError('Admin not found', 404, 'NOT_FOUND');

      // 3️⃣ Prepare redirect URL - use stored callback or derive from redirect_url
      const callbackUrl = request.metadata?.callbackUrl || `${APP_URL}/auth/callback/${request.client_key}`;
      logger.info(`Callback URL: ${callbackUrl}`);

      // 4️⃣ Create client in Keycloak
      const realm = process.env.KEYCLOAK_REALM || "my-projects";
      logger.info(`KEYCLOAK_REALM: ${realm}`);

      const kc = await getKeycloakService(realm);

      try {
        await kc.createClient({
          clientId: request.client_key,
          secret: clientSecret,
          redirectUris: [callbackUrl],
        });

        // ✅ Add protocol mapper for 'sub' claim in access token
        try {
          await kc.addProtocolMapper(request.client_key, {
            name: 'subject-id',
            protocol: 'openid-connect',
            protocolMapper: 'oidc-usermodel-property-mapper',
            config: {
              'user.attribute': 'id',
              'access.token.claim': 'true',
              'claim.name': 'sub',
              'id.token.claim': 'true',
              'userinfo.token.claim': 'true',
              'jsonType.label': 'String'
            }
          });
          logger.info(`Added 'sub' protocol mapper for client: ${request.client_key}`);
        } catch (mapperErr) {
          logger.error(`Failed to add 'sub' mapper for ${request.client_key}: ${mapperErr.message}`);
        }

        await emailModule.send({
          type: emailModule.EMAIL_TYPES.CLIENT_APPROVED,
          to: request.developer_email,
          data: {
            adminName: adminUser.name || "Admin",
            clientName: request.name,
            clientKey: request.client_key,
            developerEmail: request.developer_email,
            redirectUrl: request.redirect_url,
          }
        });

      } catch (kcErr) {
        logger.error(`Keycloak client creation failed: ${kcErr.message}`);
        await transaction.rollback();
        throw new AppError('Failed to create Keycloak client', 500, 'KC_CREATION_FAILED', { originalError: kcErr.message });
      }

      // 5️⃣ Save client in local DB

      // Fetch correct realm ID
      const { Realm } = require('../../config/database');
      const realmRecord = await Realm.findOne({ where: { realm_name: realm } });
      const realmId = realmRecord ? realmRecord.id : 1; // Default to 1 (my-projects) if not found

      let client;
      try {
        client = await Client.create(
          {
            client_key: request.client_key,
            realm,
            realm_id: realmId,
            client_id: request.client_key,
            client_secret: clientSecret,
            callback_url: callbackUrl,
            redirect_url: request.redirect_url,
            requires_tenant: request.requires_tenant || false,
            tenant_id: request.tenant_id || null,
            requires_organization: request.requires_organization || false,
            organization_model: request.organization_model || null,
            onboarding_flow: request.onboarding_flow || null,
            organization_features: request.organization_features || null
          },
          { transaction }
        );
      } catch (dbErr) {
        logger.error(`Database client creation failed: ${dbErr.message}`);
        await transaction.rollback();
        throw new AppError('Failed to save client in DB', 500, 'DB_CREATION_FAILED', { originalError: dbErr.message });
      }

      // 6️⃣ Update request status
      await request.update(
        {
          status: "approved",
          approved_at: new Date(),
          approved_by: adminUser.id,
        },
        { transaction }
      );

      await transaction.commit();

      await emailModule.send({
        type: emailModule.EMAIL_TYPES.CLIENT_APPROVED,
        to: request.developer_email,
        data: {
          adminName: adminUser.name || "Admin",
          clientName: request.name,
          clientKey: request.client_key,
          developerEmail: request.developer_email,
          redirectUrl: request.redirect_url,
          description: request.description,
          approvalUrl: request.redirect_url,
        },
      });

      // 8️⃣ Send success response
      return ResponseHandler.success(res, {
        message: "Client request approved successfully",
        client: {
          id: client.id,
          clientKey: client.client_key,
          name: request.name,
          organizationSupport: {
            enabled: client.requires_organization,
            model: client.organization_model,
            onboardingFlow: client.onboarding_flow,
            features: client.organization_features
          }
        }
      }, 'Client request approved successfully');
    } catch (error) {
      if (transaction && !transaction.finished) await transaction.rollback();
      if (error instanceof AppError) throw error;
      logger.error(`Approval process failed: ${error.stack}`);
      throw new AppError('Internal server error during approval', 500, 'APPROVAL_FAILED', { originalError: error.message });
    }
  })
);

// ✅ Admin: Get single client request by ID
router.get('/admin/client-requests/:id', asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Fetching client request:', id);

    // Simple query without include to avoid column issues
    const request = await ClientRequest.findByPk(id);

    if (!request) {
      throw new AppError('Request not found', 404, 'NOT_FOUND');
    }

    // Optionally fetch approver info if approved_by exists
    let approver = null;
    if (request.approved_by) {
      approver = await UserMetadata.findByPk(request.approved_by, {
        attributes: ['id', 'email', 'keycloak_id']
      });
    }

    return ResponseHandler.success(res, {
      request: {
        ...request.toJSON(),
        approver: approver ? approver.toJSON() : null
      }
    }, 'Client request retrieved successfully');
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Failed to get client request:', error);
    throw new AppError('Failed to get client request', 500, 'FETCH_FAILED', { originalError: error.message });
  }
}));


// ✅ Admin: Update client request
router.put('/admin/client-requests/:id', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      clientKey,
      redirectUrl,
      description,
      developerEmail,
      developerName,
      callbackUrl,
      requiresOrganization,
      organizationModel,
      organizationFeatures,
      onboardingFlow
    } = req.body;

    const request = await ClientRequest.findByPk(id);

    if (!request) {
      throw new AppError('Request not found', 404, 'NOT_FOUND');
    }

    // Only allow editing pending requests
    if (request.status !== 'pending') {
      throw new AppError('Only pending requests can be edited', 400, 'INVALID_STATUS');
    }

    // Check if new clientKey is unique (if changed)
    if (clientKey && clientKey !== request.client_key) {
      const existingClient = await Client.findOne({ where: { client_key: clientKey } });
      const existingRequest = await ClientRequest.findOne({
        where: { client_key: clientKey, id: { [require('sequelize').Op.ne]: id } }
      });

      if (existingClient || existingRequest) {
        throw new AppError('Client key already exists', 409, 'CONFLICT');
      }
    }

    // Update the request
    await request.update({
      name: name || request.name,
      client_key: clientKey || request.client_key,
      redirect_url: redirectUrl || request.redirect_url,
      description: description !== undefined ? description : request.description,
      developer_email: developerEmail || request.developer_email,
      developer_name: developerName || request.developer_name,
      requires_organization: requiresOrganization !== undefined ? requiresOrganization : request.requires_organization,
      organization_model: organizationModel || request.organization_model,
      organization_features: organizationFeatures || request.organization_features,
      onboarding_flow: onboardingFlow || request.onboarding_flow,
      metadata: {
        ...request.metadata,
        callbackUrl: callbackUrl || request.metadata?.callbackUrl,
        lastEditedAt: new Date().toISOString(),
        lastEditedBy: req.user?.sub
      }
    });

    logger.info(`Client request ${id} updated by ${req.user?.sub}`);

    return ResponseHandler.success(res, {
      message: 'Client request updated successfully',
      request: {
        id: request.id,
        clientKey: request.client_key,
        name: request.name,
        status: request.status
      }
    }, 'Client request updated successfully');
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Failed to update client request:', error);
    throw new AppError('Failed to update client request', 500, 'UPDATE_FAILED', { originalError: error.message });
  }
}));

// ✅ Admin: Delete client request
router.delete('/admin/client-requests/:id', authMiddleware, asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.sub || null;

    const request = await ClientRequest.findByPk(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Only allow deleting pending or rejected requests
    if (request.status === 'approved') {
      throw new AppError('Approved requests cannot be deleted. Delete the client instead.', 400, 'INVALID_OPERATION');
    }

    const deletedRequestInfo = {
      id: request.id,
      clientKey: request.client_key,
      name: request.name,
      status: request.status
    };

    await request.destroy();

    logger.info(`Client request ${id} (${deletedRequestInfo.clientKey}) deleted by ${adminId}`);

    return ResponseHandler.success(res, {
      message: 'Client request deleted successfully',
      request: deletedRequestInfo
    }, 'Client request deleted successfully');
  } catch (error) {
    logger.error('Failed to delete client request:', error);
    throw new AppError('Failed to delete client request', 500, 'DELETION_FAILED', { originalError: error.message });
  }
}));

// ✅ Admin: Reject request
router.post('/admin/client-requests/:id/reject', asyncHandler(async (req, res) => {
  logger.info(`Rejecting client request with ID: ${req.params.id}`);

  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.sub || null;

    const adminUser = await UserMetadata.findOne({
      where: {
        keycloak_id: "a9718b7a-6588-46bf-bf3c-9ac9a8e675db"
      }
    });
    if (!adminUser) throw new AppError('Admin not found', 404, 'NOT_FOUND');

    const request = await ClientRequest.findByPk(id);
    if (!request || request.status !== 'pending') {
      throw new AppError('Invalid request', 400, 'INVALID_REQUEST');
    }

    await request.update({
      status: 'rejected',
      rejectionReason: reason,
      approvedBy: adminUser.id
    });

    await emailModule.send({
      type: emailModule.EMAIL_TYPES.CLIENT_REJECTED,
      to: request.developer_email,
      data: {
        adminName: adminUser.name || 'Admin',
        clientName: request.name,
        clientKey: request.client_key,
        developerEmail: request.developer_email,
        redirectUrl: request.redirect_url,
        description: request.description,
        rejectionReason: reason || 'No reason provided'
      }
    });

    return ResponseHandler.success(res, { message: 'Client request rejected' }, 'Client request rejected successfully');
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to reject client request', 500, 'REJECTION_FAILED', { originalError: error.message });
  }
}));

module.exports = router;