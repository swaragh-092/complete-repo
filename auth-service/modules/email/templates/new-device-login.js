exports.newDeviceLoginTemplate = (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .device-info { background: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
          .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 New Device Detected</h1>
          </div>
          
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>We detected a login from a new device:</p>
            
            <div class="device-info">
              <p><strong>Device:</strong> ${data.deviceName}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'long'
    })}</p>
            </div>
            
            <p><strong>Was this you?</strong></p>
            <p>If this was you, you can mark this device as trusted to skip verification on future logins.</p>
            
            <p>If this wasn't you, please secure your account immediately:</p>
            <ul>
              <li>Change your password</li>
              <li>Review your trusted devices</li>
              <li>Enable two-factor authentication</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>This is an automated security notification.</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Your App'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
}