const Layout = require('./components/_layout');
const { InfoBox, KeyValue, Button } = require('./components/_components');

exports.organizationCreatedTemplate = (data) => {
    const content = `
    <p>Hello <strong>${data.userName}</strong>,</p>
    <p>🎉 Congratulations! Your new organization <strong>${data.organizationName}</strong> has been successfully created.</p>
    
    ${InfoBox({
        title: 'Organization Details',
        style: 'success',
        children: `
        ${KeyValue({ label: 'Organization', value: data.organizationName })}
        ${KeyValue({ label: 'Your Role', value: data.role })}
      `
    })}

    <p>You can now access your dashboard to manage members, settings, and billing.</p>
    
    <div style="text-align: center; margin: 30px 0;">
        ${Button({ url: data.dashboardUrl, text: 'Go to Dashboard' })}
    </div>

    <p style="text-align: center; font-size: 14px; color: #6b7280;">
      Want to grow your team? <a href="${data.inviteUrl}" style="color: #6366f1;">Invite members now</a>.
    </p>
  `;

    return Layout({
        title: 'Welcome to your new Organization!',
        content,
        appName: process.env.APP_NAME || 'Auth Service',
        previewText: `Get started with ${data.organizationName}`
    });
};
