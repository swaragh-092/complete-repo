// exports.clientRejectedTemplate = (data) => {
//     return `
//       <div style="font-family: Arial, sans-serif; max-width: 600px;">
//         <h2>❌ Client Registration Rejected</h2>
//         <p>Hello ${data.clientName},</p>
//         <p>We regret to inform you that your client registration has been rejected.</p>
        
//         <div style="background: #f5f5f5; padding: 15px; margin: 15px 0;">
//           <h3>${data.clientName}</h3>
//           <p><strong>Client Key:</strong> ${data.clientKey}</p>
//           <p><strong>Developer:</strong> ${data.developerEmail}</p>
//           <p><strong>Redirect URL:</strong> ${data.redirectUrl}</p>
//           <p><strong>Reason:</strong> ${data.reason || 'Not specified'}</p>
//         </div>

//         <p>If you have any questions, please contact support.</p>
//       </div>
//     `}

const Layout = require('./components/_layout');
const { InfoBox } = require('./components/_components');



exports.clientRejectedTemplate = (data) => {
  const content = `

  ${InfoBox({
    title: 'Client Registration Rejected',
    children: `
    ${KeyValue({ label: 'Client Name', value: data.clientName })}
    ${KeyValue({ label: 'Client Key', value: data.clientKey })}
    ${KeyValue({ label: 'Developer', value: data.developerEmail })}
    ${KeyValue({ label: 'Redirect URL', value: data.redirectUrl })}
    ${KeyValue({ label: 'Reason', value: data.reason || 'Not specified' })}
    `,
    style: 'danger'
  })}
  
  `

  return Layout({
    title: 'Client Registration Rejected',
    content,
    appName: process.env.APP_NAME || 'Auth Service',
    previewText: 'Client registration rejected'
  })
}


