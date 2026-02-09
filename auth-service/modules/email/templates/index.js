const { clientRequestTemplate } = require('./client-request');
const { clientApprovedTemplate } = require('./client-approved');
const { clientRejectedTemplate } = require('./client-rejected');
const { organizationInvitationTemplate } = require('./organization-invitation');
const { workspaceInvitationTemplate } = require('./workspace-invitation');
const { newDeviceLoginTemplate } = require('./new-device-login');
const { highRiskLoginTemplate } = require('./high-risk-login');
const { organizationCreatedTemplate } = require('./organization-created');
const { securityAlertTemplate } = require('./security-alert');

const EMAIL_TYPES = {
    CLIENT_REQUEST: 'CLIENT_REQUEST',
    CLIENT_APPROVED: 'CLIENT_APPROVED',
    CLIENT_REJECTED: 'CLIENT_REJECTED',
    ORGANIZATION_INVITATION: 'ORGANIZATION_INVITATION',
    ORGANIZATION_CREATED: 'ORGANIZATION_CREATED',
    SECURITY_ALERT: 'SECURITY_ALERT',
    WORKSPACE_INVITATION: 'WORKSPACE_INVITATION',
    NEW_DEVICE_LOGIN: 'NEW_DEVICE_LOGIN',
    HIGH_RISK_LOGIN: 'HIGH_RISK_LOGIN'
};

const templates = {
    [EMAIL_TYPES.CLIENT_REQUEST]: clientRequestTemplate,
    [EMAIL_TYPES.CLIENT_APPROVED]: clientApprovedTemplate,
    [EMAIL_TYPES.CLIENT_REJECTED]: clientRejectedTemplate,
    [EMAIL_TYPES.ORGANIZATION_INVITATION]: organizationInvitationTemplate,
    [EMAIL_TYPES.ORGANIZATION_CREATED]: organizationCreatedTemplate,
    [EMAIL_TYPES.SECURITY_ALERT]: securityAlertTemplate,
    [EMAIL_TYPES.WORKSPACE_INVITATION]: workspaceInvitationTemplate,
    [EMAIL_TYPES.NEW_DEVICE_LOGIN]: newDeviceLoginTemplate,
    [EMAIL_TYPES.HIGH_RISK_LOGIN]: highRiskLoginTemplate
};

module.exports = {
    EMAIL_TYPES,
    templates
};
