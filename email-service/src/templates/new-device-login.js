const Layout = require('./components/_layout');
const { InfoBox, KeyValue, Button } = require('./components/_components');

exports.newDeviceLoginTemplate = (data) => {
  const content = `
    <p>We detected a login from a new device.</p>

    ${InfoBox({
    title: 'Device Details',
    children: `
        ${KeyValue({ label: 'Device', value: data.deviceName })}
        ${KeyValue({ label: 'Location', value: data.location })}
        ${KeyValue({ label: 'Time', value: new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' }) })}
        `,
    style: 'warning'
  })}

    <p><strong>Was this you?</strong></p>
    <p>If this was you, you can ignore this message or manage your trusted devices below.</p>

    ${Button({
    url: `${process.env.FRONTEND_URL}/security/devices`,
    text: 'Review Trusted Devices',
    style: 'primary'
  })}

    <p style="margin-top: 20px; font-size: 12px; color: #666;">
        If this wasn't you, please change your password immediately.
    </p>
    `;

  return Layout({
    title: '🔐 New Device Detected',
    content,
    appName: process.env.APP_NAME || 'Auth Service',
    previewText: 'New device login detected'
  });
};