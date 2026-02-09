const Layout = require('./_layout');
const { InfoBox, KeyValue, Button } = require('./_components');

exports.clientApprovedTemplate = (data) => {
    const content = `
    <p>Hello <strong>${data.clientName}</strong>,</p>
    <p>🎉 Your client registration has been approved! You can now start integrating with our services.</p>
    
    ${InfoBox({
        title: 'Registration Details',
        style: 'success',
        children: `
        ${KeyValue({ label: 'Client Name', value: data.clientName })}
        ${KeyValue({ label: 'Client Key', value: data.clientKey })}
        ${KeyValue({ label: 'Developer', value: data.developerEmail })}
        ${KeyValue({ label: 'Redirect URL', value: data.redirectUrl })}
      `
    })}

    <p>Make sure to keep your Client Key secure. You can now use this key to authenticate your application.</p>
  `;

    return Layout({
        title: '✅ Client Registration Approved',
        content,
        appName: process.env.APP_NAME || 'Auth Service',
        previewText: `Your client registration for ${data.clientName} has been approved`
    });
};