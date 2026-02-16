const Layout = require('./components/_layout');
const { InfoBox, KeyValue, Button } = require('./components/_components');

exports.clientRequestTemplate = (data) => {
  const content = `
    <p>Hello <strong>${data.adminName}</strong>,</p>
    <p>A new client registration request has been submitted and is pending your review.</p>
    
    ${InfoBox({
    title: 'Client Details',
    children: `
        ${KeyValue({ label: 'Client Name', value: data.clientName })}
        ${KeyValue({ label: 'Client Key', value: data.clientKey })}
        ${KeyValue({ label: 'Developer', value: data.developerEmail })}
        ${KeyValue({ label: 'Redirect URL', value: data.redirectUrl })}
        ${data.description ? KeyValue({ label: 'Description', value: data.description }) : ''}
      `
  })}

    ${Button({ url: data.approveUrl, text: 'Review Request', style: 'primary' })}
  `;

  return Layout({
    title: '🔐 New Client Registration Request',
    content,
    appName: process.env.APP_NAME || 'Auth Service',
    previewText: `New client registration request from ${data.developerEmail}`
  });
}; 