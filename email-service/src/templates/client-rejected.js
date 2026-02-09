exports.clientRejectedTemplate = (data) => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>❌ Client Registration Rejected</h2>
        <p>Hello ${data.clientName},</p>
        <p>We regret to inform you that your client registration has been rejected.</p>
        
        <div style="background: #f5f5f5; padding: 15px; margin: 15px 0;">
          <h3>${data.clientName}</h3>
          <p><strong>Client Key:</strong> ${data.clientKey}</p>
          <p><strong>Developer:</strong> ${data.developerEmail}</p>
          <p><strong>Redirect URL:</strong> ${data.redirectUrl}</p>
          <p><strong>Reason:</strong> ${data.reason || 'Not specified'}</p>
        </div>

        <p>If you have any questions, please contact support.</p>
      </div>
    `}