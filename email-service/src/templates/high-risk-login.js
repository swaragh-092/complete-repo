exports.highRiskLoginTemplate = (data) => {
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { background: #fff3cd; padding: 20px; margin: 20px 0; border: 2px solid #f44336; }
          .risk-badge { display: inline-block; padding: 5px 15px; background: #f44336; color: white; border-radius: 20px; font-weight: bold; }
          .device-info { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
          .button { display: inline-block; padding: 12px 30px; background: #f44336; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ High-Risk Login Detected</h1>
          </div>
          
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>We detected a <span class="risk-badge">HIGH RISK</span> login attempt to your account.</p>
            
            <div class="device-info">
              <p><strong>Device:</strong> ${data.deviceName}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'long'
  })}</p>
              <p><strong>Risk Score:</strong> ${data.riskScore.score}/100</p>
              <p><strong>Risk Factors:</strong></p>
              <ul>
                ${Object.entries(data.riskScore.breakdown).map(([key, value]) =>
    `<li>${key}: ${value} points</li>`
  ).join('')}
              </ul>
            </div>
            
            <p><strong style="color: #f44336;">⚠️ URGENT: Was this you?</strong></p>
            <p>If you did NOT attempt this login, take immediate action:</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL}/security/change-password" class="button">Change Password</a>
              <a href="${process.env.FRONTEND_URL}/security/devices" class="button">Review Devices</a>
            </div>
            
            <p><strong>Recommended actions:</strong></p>
            <ol>
              <li>Change your password immediately</li>
              <li>Review and revoke any unknown devices</li>
              <li>Enable two-factor authentication</li>
              <li>Check recent account activity</li>
            </ol>
          </div>
          
          <div class="footer">
            <p>This is an automated security alert.</p>
            <p>If you need assistance, contact our security team immediately.</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Your App'} Security Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
}

