// auth-service/services/email.service.js
const nodemailer = require('nodemailer');
require('dotenv').config();
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

class EmailService {
  constructor() {

    logger.info('SMTP Environment Variables:', {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER ? '***masked***' : 'UNDEFINED',
      SMTP_PASS: process.env.SMTP_PASS ? '***masked***' : 'UNDEFINED',
      FROM_EMAIL: process.env.FROM_EMAIL
    });

    // Validate required environment variables
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new AppError('SMTP_USER and SMTP_PASS environment variables are required', 500, 'SMTP_CONFIG_MISSING');
    }


    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      debug: true,
      logger: true,
    });
  }




  async sendEmail({ to, subject, template, data }) {
    try {
      const htmlContent = this.renderTemplate(template, data);

      const result = await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
        to,
        subject,
        html: htmlContent,
      });

      logger.info('✅ Email sent successfully:', result.messageId);
      logger.info('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
      return result;
    } catch (error) {
      logger.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  renderTemplate(templateName, data) {
    switch (templateName) {
      case 'client-request':
        return this.clientRequestTemplate(data);
      case 'client-approved':
        return this.clientApprovedTemplate(data);
      case 'client-rejected':
        return this.clientRejectedTemplate(data);
      case 'organization-invitation':
        return this.organizationInvitationTemplate(data);
      case 'workspace-invitation':
        return this.workspaceInvitationTemplate(data);
      default:
        return '<p>Default email template</p>';
    }
  }

  /**
   * Organization invitation email template
   */
  organizationInvitationTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .org-info { background: white; padding: 20px; border-left: 4px solid #6366f1; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
          .expires { background: #fff3cd; padding: 10px 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 You're Invited!</h1>
            <p style="margin: 0; opacity: 0.9;">Join ${data.organizationName} on ${data.appName || 'our platform'}</p>
          </div>
          
          <div class="content">
            <p>Hi there,</p>
            <p><strong>${data.inviterName || data.inviterEmail}</strong> has invited you to join their organization:</p>
            
            <div class="org-info">
              <h3 style="margin: 0 0 10px 0;">🏢 ${data.organizationName}</h3>
              <p style="margin: 5px 0;"><strong>Your Role:</strong> ${data.roleName}</p>
              ${data.message ? `<p style="margin: 5px 0;"><strong>Message:</strong> ${data.message}</p>` : ''}
            </div>
            
            <div style="text-align: center;">
              <a href="${data.invitationLink}" class="button">Accept Invitation</a>
            </div>
            
            <div class="expires">
              ⏰ This invitation expires on <strong>${new Date(data.expiresAt).toLocaleDateString('en-US', { dateStyle: 'full' })}</strong>
            </div>
            
            <p style="font-size: 13px; color: #666;">
              If you can't click the button, copy and paste this link into your browser:<br>
              <a href="${data.invitationLink}" style="word-break: break-all;">${data.invitationLink}</a>
            </p>
          </div>
          
          <div class="footer">
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} ${data.appName || 'Your App'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  clientRequestTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>🔐 New Client Registration Request</h2>
        <p>Hello ${data.adminName},</p>
        <p>A new client registration request has been submitted:</p>
        
        <div style="background: #f5f5f5; padding: 15px; margin: 15px 0;">
          <h3>${data.clientName}</h3>
          <p><strong>Client Key:</strong> ${data.clientKey}</p>
          <p><strong>Developer:</strong> ${data.developerEmail}</p>
          <p><strong>Redirect URL:</strong> ${data.redirectUrl}</p>
          <p><strong>Description:</strong> ${data.description}</p>
        </div>

        <p>
          <a href="${data.approveUrl}" 
             style="background: #16A34A; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px;">
            Review Request
          </a>
        </p>
      </div>
    `;
  }
  clientApprovedTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>✅ Client Registration Approved</h2>
        <p>Hello ${data.clientName},</p>
        <p>Your client registration has been approved!</p>
        
        <div style="background: #f5f5f5; padding: 15px; margin: 15px 0;">
          <h3>${data.clientName}</h3>
          <p><strong>Client Key:</strong> ${data.clientKey}</p>
          <p><strong>Developer:</strong> ${data.developerEmail}</p>
          <p><strong>Redirect URL:</strong> ${data.redirectUrl}</p>
        </div>

        <p>You can now start using our services.</p>
      </div>
    `;
  }

  clientRejectedTemplate(data) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>❌ Client Registration Rejected</h2>
        <p>Hello ${data.clientName},</p>
        <p>We regret to inform you that your client registration has been rejected.</p>
        
        <div style="background: #f5f5f5; padding: 15px; margin: 15px 0;">
          <h3>${data.clientName}</h3>
          <p><strong>Client Key:</strong> ${data.clientKey}</p>
          <p><strong>Developer:</strong> ${data.developerEmail}</p>
          <p><strong>Redirect URL:</strong> ${data.redirectUrl}</p>
          <p><strong>Reason:</strong> ${data.reason || 'Not specified'}</p>
        </div>

        <p>If you have any questions, please contact support.</p>
      </div>
    `}


  // Add more templates...

  /**
   * Workspace invitation email template
   */
  workspaceInvitationTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .workspace-info { background: white; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
          .expires { background: #dbeafe; padding: 10px 15px; border-radius: 4px; margin: 15px 0; }
          .role-badge { display: inline-block; padding: 4px 12px; background: #e0e7ff; color: #3730a3; border-radius: 4px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Workspace Invitation</h1>
            <p style="margin: 0; opacity: 0.9;">Join ${data.workspaceName}</p>
          </div>
          
          <div class="content">
            <p>Hi there,</p>
            <p><strong>${data.inviterEmail}</strong> has invited you to join a workspace:</p>
            
            <div class="workspace-info">
              <h3 style="margin: 0 0 10px 0;">${data.workspaceName}</h3>
              <p style="margin: 5px 0;"><strong>Organization:</strong> ${data.organizationName}</p>
              <p style="margin: 5px 0;"><strong>Your Role:</strong> <span class="role-badge">${data.role}</span></p>
              ${data.message ? '<p style="margin: 10px 0 0 0; font-style: italic;">"' + data.message + '"</p>' : ''}
            </div>
            
            <div style="text-align: center;">
              <a href="${data.invitationLink}" class="button">Accept Invitation</a>
            </div>
            
            <div class="expires">
              This invitation expires on <strong>${data.expiresAt}</strong>
            </div>
            
            <p style="font-size: 13px; color: #666;">
              If you can't click the button, copy and paste this link into your browser:<br>
              <a href="${data.invitationLink}" style="word-break: break-all;">${data.invitationLink}</a>
            </p>
          </div>
          
          <div class="footer">
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // services/email.service.js

  /**
   * Send new device detection notification
   */
  async sendNewDeviceNotification(email, userName, deviceName, location) {
    try {
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .device-info { background: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
          .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 New Device Detected</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We detected a login from a new device:</p>
            
            <div class="device-info">
              <p><strong>Device:</strong> ${deviceName}</p>
              <p><strong>Location:</strong> ${location}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'long'
      })}</p>
            </div>
            
            <p><strong>Was this you?</strong></p>
            <p>If this was you, you can mark this device as trusted to skip verification on future logins.</p>
            
            <p>If this wasn't you, please secure your account immediately:</p>
            <ul>
              <li>Change your password</li>
              <li>Review your trusted devices</li>
              <li>Enable two-factor authentication</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is an automated security notification.</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Your App'}</p>
          </div>
        </div>
      </body>
      </html>
    `;

      await this.sendEmail({
        to: email,
        subject: `🔐 New Device Login - ${deviceName}`,
        html
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to send device notification:', error);
      throw error;
    }
  }

  /**
   * Send high-risk login alert
   */
  async sendHighRiskLoginAlert(email, userName, deviceName, location, riskScore) {
    try {
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { background: #fff3cd; padding: 20px; margin: 20px 0; border: 2px solid #f44336; }
          .risk-badge { display: inline-block; padding: 5px 15px; background: #f44336; color: white; border-radius: 20px; font-weight: bold; }
          .device-info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
          .button { display: inline-block; padding: 12px 30px; background: #f44336; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ High-Risk Login Detected</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We detected a <span class="risk-badge">HIGH RISK</span> login attempt to your account.</p>
            
            <div class="device-info">
              <p><strong>Device:</strong> ${deviceName}</p>
              <p><strong>Location:</strong> ${location}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'long'
      })}</p>
              <p><strong>Risk Score:</strong> ${riskScore.score}/100</p>
              <p><strong>Risk Factors:</strong></p>
              <ul>
                ${Object.entries(riskScore.breakdown).map(([key, value]) =>
        `<li>${key}: ${value} points</li>`
      ).join('')}
              </ul>
            </div>
            
            <p><strong style="color: #f44336;">⚠️ URGENT: Was this you?</strong></p>
            <p>If you did NOT attempt this login, take immediate action:</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/security/change-password" class="button">Change Password</a>
              <a href="${process.env.FRONTEND_URL}/security/devices" class="button">Review Devices</a>
            </div>
            
            <p><strong>Recommended actions:</strong></p>
            <ol>
              <li>Change your password immediately</li>
              <li>Review and revoke any unknown devices</li>
              <li>Enable two-factor authentication</li>
              <li>Check recent account activity</li>
            </ol>
          </div>
          
          <div class="footer">
            <p>This is an automated security alert.</p>
            <p>If you need assistance, contact our security team immediately.</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Your App'} Security Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

      await this.sendEmail({
        to: email,
        subject: `⚠️ HIGH-RISK LOGIN ALERT - Immediate Action Required`,
        html
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to send high-risk alert:', error);
      throw error;
    }
  }

}

module.exports = EmailService;
