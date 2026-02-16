const Layout = require('./components/_layout');
const { InfoBox, KeyValue, Button, Badge } = require('./components/_components');

exports.workspaceInvitationTemplate = (data) => {
  const content = `
    <p>Hi there,</p>
    <p><strong>${data.inviterEmail}</strong> has invited you to join a workspace.</p>
    
    ${InfoBox({
    title: `Workspace: ${data.workspaceName}`,
    children: `
        ${KeyValue({ label: 'Organization', value: data.organizationName })}
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
           <span style="color: #6b7280; font-weight: 500;">Your Role</span>
           ${Badge({ text: data.role })}
        </div>
        ${data.message ? `<p style="background: #f9fafb; padding: 10px; border-radius: 4px; font-style: italic; color: #4b5563;">"${data.message}"</p>` : ''}
      `
  })}

    ${Button({ url: data.invitationLink, text: 'Accept Invitation' })}

    <p style="text-align: center; color: #6b7280; font-size: 14px;">
      This invitation expires on <strong>${data.expiresAt}</strong>.
    </p>

    <p style="font-size: 13px; color: #9ca3af; margin-top: 20px;">
      If you can't click the button, copy and paste this link into your browser:<br>
      <a href="${data.invitationLink}" style="word-break: break-all; color: #6366f1;">${data.invitationLink}</a>
    </p>
  `;

  return Layout({
    title: 'Workspace Invitation',
    content,
    appName: process.env.APP_NAME || 'Auth Service',
    previewText: `You have been invited to join ${data.workspaceName}`
  });
};