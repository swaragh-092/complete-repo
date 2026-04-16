// auth-service/services/notifications.js
const { UserMetadata: User, Notification } = require('../config/database');
const emailModule = require('./email-client');
const logger = require('../utils/logger');

async function sendEmail(payload) {
  try {
    return await emailModule.send(payload);
  } catch (error) {
    logger.error('Email send failed', { error: error.message, to: payload.to, type: payload.type });
    // Don't throw for notifications to avoid breaking main flow
  }
}

async function notifyAdmins(clientRequest) {
  try {
    // Get all admin users
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: ['email', 'name']
    });

    // Send email notifications
    for (const admin of admins) {
      await sendEmail({
        type: emailModule.EMAIL_TYPES.CLIENT_REQUEST,
        to: admin.email,
        data: {
          adminName: admin.name,
          clientName: clientRequest.name,
          clientKey: clientRequest.clientKey,
          developerEmail: clientRequest.developerEmail,
          description: clientRequest.description,
          approveUrl: `${process.env.ADMIN_UI_URL}/client-requests/${clientRequest.id}`,
          redirectUrl: clientRequest.redirectUrl
        }
      });
    }

    // Create in-app notification (only if Notification model exists)
    if (Notification) {
      await Notification.create({
        type: 'client_request',
        title: 'New Client Registration Request',
        message: `${clientRequest.developerName} requested to register "${clientRequest.name}"`,
        data: { clientRequestId: clientRequest.id },
        targetRole: 'admin'
      });
    }

  } catch (error) {
    logger.error('Failed to notify admins', { error: error.message });
  }
}

async function notifyDeveloper(request, status, client = null) {
  if (!request.developerEmail) return;

  const type = status === 'approved'
    ? emailModule.EMAIL_TYPES.CLIENT_APPROVED
    : emailModule.EMAIL_TYPES.CLIENT_REJECTED;

  await sendEmail({
    type,
    to: request.developerEmail,
    data: {
      clientName: request.name,
      clientKey: request.clientKey,
      status,
      reason: request.rejectionReason,
      // For approved template
      developerEmail: request.developerEmail,
      redirectUrl: request.redirectUrl
    }
  });
}

module.exports = {
  notifyAdmins,
  notifyDeveloper
};
