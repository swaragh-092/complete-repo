const Layout = require('./_layout');
const { InfoBox, KeyValue, Button } = require('./_components');

exports.organizationInvitationTemplate = (data) => {
    const content = `
    <p>Hi there,</p>
    <p><strong>${data.inviterName || data.inviterEmail}</strong> has invited you to join their organization.</p>
    
    ${InfoBox({
        title: `🏢 ${data.organizationName}`,
        children: `
        ${KeyValue({ label: 'Your Role', value: data.roleName })}
        ${data.message ? `<p style="background: #f9fafb; padding: 10px; border-radius: 4px; font-style: italic; color: #4b5563;">"${data.message}"</p>` : ''}
      `
    })}

    ${Button({ url: data.invitationLink, text: 'Accept Invitation' })}

    <p style="text-align: center; color: #6b7280; font-size: 14px;">
      ⏰ This invitation expires on <strong>${new Date(data.expiresAt).toLocaleDateString('en-US', { dateStyle: 'full' })}</strong>
    </p>

    <p style="font-size: 13px; color: #9ca3af; margin-top: 20px;">
      If you can't click the button, copy and paste this link into your browser:<br>
      <a href="${data.invitationLink}" style="word-break: break-all; color: #6366f1;">${data.invitationLink}</a>
    </p>
  `;

    return Layout({
        title: '🎉 You\'re Invited!',
        content,
        appName: data.appName || 'Auth Service',
        previewText: `Invitation to join ${data.organizationName}`
    });
};