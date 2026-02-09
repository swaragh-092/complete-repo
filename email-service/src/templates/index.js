'use strict';

const { EMAIL_TYPES } = require('../config/constants');

// Import templates
const { clientRequestTemplate } = require('./client-request');
const { clientApprovedTemplate } = require('./client-approved');
const { clientRejectedTemplate } = require('./client-rejected');
const { organizationInvitationTemplate } = require('./organization-invitation');
const { workspaceInvitationTemplate } = require('./workspace-invitation');
const { organizationCreatedTemplate } = require('./organization-created');
const { newDeviceLoginTemplate } = require('./new-device-login');
const { highRiskLoginTemplate } = require('./high-risk-login');
const { securityAlertTemplate } = require('./security-alert');

/**
 * Template Registry
 * Maps EMAIL_TYPES to their implementation
 */
const TEMPLATES = {
    [EMAIL_TYPES.CLIENT_REQUEST]: {
        subject: (data) => `New API Client Request: ${data.clientName}`,
        render: clientRequestTemplate,
    },
    [EMAIL_TYPES.CLIENT_APPROVED]: {
        subject: 'Your API Client Request has been Approved',
        render: clientApprovedTemplate,
    },
    [EMAIL_TYPES.CLIENT_REJECTED]: {
        subject: 'Update on your API Client Request',
        render: clientRejectedTemplate,
    },
    [EMAIL_TYPES.ORGANIZATION_INVITATION]: {
        subject: (data) => `Invitation to join ${data.organizationName}`,
        render: organizationInvitationTemplate,
    },
    [EMAIL_TYPES.WORKSPACE_INVITATION]: {
        subject: (data) => `Invitation to join ${data.workspaceName} on ${data.organizationName}`,
        render: workspaceInvitationTemplate,
    },
    [EMAIL_TYPES.ORGANIZATION_CREATED]: {
        subject: (data) => `Welcome to your new Organization: ${data.organizationName}`,
        render: organizationCreatedTemplate,
    },
    [EMAIL_TYPES.NEW_DEVICE_LOGIN]: {
        subject: 'New login detected for your account',
        render: newDeviceLoginTemplate,
    },
    [EMAIL_TYPES.HIGH_RISK_LOGIN]: {
        subject: '🚨 Security Alert: Suspicious Login Attempt Blocked',
        render: highRiskLoginTemplate,
    },
    [EMAIL_TYPES.SECURITY_ALERT]: {
        subject: (data) => `Security Alert: ${data.alertTitle}`,
        render: securityAlertTemplate,
    },
};

module.exports = TEMPLATES;
