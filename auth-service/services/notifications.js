// auth-service/services/notifications.js
const { UserMetadata: User, Notification } = require('../config/database');
const EmailService = require('./email.service');
const logger = require('../utils/logger');

const emailService = new EmailService();

async function sendEmail(options) {
  try {
    return await emailService.send(options);
  } catch (error) {
    logger.error('Email send failed', { error: error.message, to: options.to });
    throw error;
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
        to: admin.email,
        subject: `New Client Registration Request: ${clientRequest.name}`,
        template: 'client-request',
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

  const subject = status === 'approved'
    ? `✅ Client "${request.name}" Approved!`
    : `❌ Client "${request.name}" Rejected`;

  await sendEmail({
    to: request.developerEmail,
    subject,
    template: status === 'approved' ? 'client-approved' : 'client-rejected',
    data: {
      clientName: request.name,
      clientKey: request.clientKey,
      status,
      reason: request.rejectionReason,
      ...(client && {
        clientId: client.id,
        setupInstructions: `Your client is now active! Update your account-ui registry and start using SSO.`
      })
    }
  });
}


module.exports = {
  notifyAdmins,
  notifyDeveloper
};
