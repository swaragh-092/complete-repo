const Layout = require('./_layout');
const { InfoBox, KeyValue, Button } = require('./_components');

exports.securityAlertTemplate = (data) => {
    const content = `
    <p>Hello <strong>${data.userName}</strong>,</p>
    <p>🚨 <strong>Security Alert:</strong> ${data.alertTitle}</p>
    
    ${InfoBox({
        title: 'Alert Details',
        style: 'warning',
        children: `
        <p style="margin: 0; color: #b91c1c;">${data.alertMessage}</p>
      `
    })}

    <p>If you did not initiate this action, please contact support immediately and change your password.</p>
    
    <div style="text-align: center; margin: 30px 0;">
        ${Button({ url: `${process.env.FRONTEND_URL}/account/security`, text: 'Review Security Settings' })}
    </div>
  `;

    return Layout({
        title: 'Security Alert',
        content,
        appName: process.env.APP_NAME || 'Auth Service',
        previewText: `Security Alert: ${data.alertTitle}`
    });
};
