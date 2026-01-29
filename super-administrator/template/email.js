// Author: Gururaj
// Created: 16th May 2025
// Description: This is to keep all the email templates
// Version: 1.0.0
// Modified: gururaj at 26th May 2025,added forgotpassword email template

require('dotenv').config();


// just for example
exports.credentialsHtml = (name, loginName, loginPassword) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>User Credentials</title>
      <style>
          /* email css */
          .reset { padding: 5px 8px; background-color: #3799bc !important; color: #fff !important; display: inline-block; margin: auto; text-decoration: none;}
          .text-c{width: 100%; text-align: center}
          p{color: #000 !important;}
          .email-wrapper{width: 100%; background-color: #f5f5f5;}
          .content-wrapper{margin: auto; border-top: 5px solid #3799bc;  width: 100% ; max-width: 600px; background-color: #fff; padding:10px 0; }
          .logo{width:100%; text-align: center;}
          .logo span{display: flex; width: 100%; max-width:150px; margin: 0 auto 10px;}
          .logo img{ width:100%}
          .logo h4{color: #102d82 !important; font-family: content-medium; margin: 0 !important; padding:0 !important }
      

          /* email css */
      </style>
  </head>
  <body>
      <div class="email-wrapper">
          <div class="content-wrapper">
              <div class="logo text-c">
                  <span><img src="${process.env.APP}${process.env.LOGO}" alt=""></span>
                  <h4>${process.env.APP_NAME}</h4>
              </div>
              <div class="email-content" style = "padding: 25px 15px;">
                  <p>Dear ${name},</p>

                  <div >
                      <p>Welcome to ${process.env.APP_NAME}!</p>
                      <p>Your account has been created successfully. Below is your credentials:</p>
                      <p><strong>Username: ${loginName}</strong></p>
                      <p><strong>Password:  ${loginPassword}</strong></p>
                      <p>Please change your password after logging in for the first time.</p>
                  </div>

                  <p>Regards,<br>
                  <a href=" ${process.env.GLOBAL}"> ${process.env.APP_NAME}</a><br>
                  </p>
              </div>
          </div>
      </div>
  </body>
  </html>

`
}

exports.subscriptionWillExpireHtml = (orgName, planName, expiryDate, subscriptionType) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${subscriptionType} Expiry Warning</title>
    <style>
      .text-c { text-align: center; }
      p { color: #000; }
      .email-wrapper { background-color: #f5f5f5; width: 100%; }
      .content-wrapper { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-top: 5px solid #f39c12; }
      .logo { text-align: center; margin-bottom: 10px; }
      .logo img { max-width: 150px; }
      .highlight { color: #e67e22; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="content-wrapper">
        <div class="logo">
          <img src="${process.env.APP}${process.env.LOGO}" alt="logo" />
          <h4>${process.env.APP_NAME}</h4>
        </div>
        <div style="padding: 10px 15px;">
          <p>${orgName},</p>
          <p>This is a reminder that your ${subscriptionType} for ${planName} with <strong>${process.env.APP_NAME}</strong> is set to expire on <span class="highlight">${expiryDate}</span>.</p>
          <p>We recommend renewing your subscription to avoid service interruptions.</p>
          <p>Regards,<br/>
          <a href="${process.env.GLOBAL}">${process.env.APP_NAME}</a></p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};


exports.subscriptionExpiredHtml = (orgName, planName,  expiryDate, subscriptionType) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${subscriptionType} Expired</title>
    <style>
      .text-c { text-align: center; }
      p { color: #000; }
      .email-wrapper { background-color: #f5f5f5; width: 100%; }
      .content-wrapper { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-top: 5px solid #c0392b; }
      .logo { text-align: center; margin-bottom: 10px; }
      .logo img { max-width: 150px; }
      .highlight { color: #c0392b; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="content-wrapper">
        <div class="logo">
          <img src="${process.env.APP}${process.env.LOGO}" alt="logo" />
          <h4>${process.env.APP_NAME}</h4>
        </div>
        <div style="padding: 10px 15px;">
          <p>Your ${subscriptionType} with <strong>${process.env.APP_NAME}</strong> expired on <span class="highlight">${expiryDate}</span> for <span class="highlight">${planName}</span>.</p>
          <p>To continue using our services, please renew your subscription at the earliest.</p>
          <p>Regards,<br/>
          <a href="${process.env.GLOBAL}">${process.env.APP_NAME}</a></p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};


exports.usageThresholdHtml = (name, usageType, limit, used) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Usage Threshold Alert</title>
    <style>
      .text-c { text-align: center; }
      p { color: #000; }
      .email-wrapper { background-color: #f5f5f5; width: 100%; }
      .content-wrapper { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-top: 5px solid #d35400; }
      .logo { text-align: center; margin-bottom: 10px; }
      .logo img { max-width: 150px; }
      .highlight { color: #d35400; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="content-wrapper">
        <div class="logo">
          <img src="${process.env.APP}${process.env.LOGO}" alt="logo" />
          <h4>${process.env.APP_NAME}</h4>
        </div>
        <div style="padding: 10px 15px;">
          <p>${name} have reaching near to <span class="highlight">${used}</span> out of your allocated <span class="highlight">${limit}</span> <strong>${usageType}</strong>.</p>
          <p>To avoid service disruption, please upgrade your plan or monitor your usage.</p>
          <p>Regards,<br/>
          <a href="${process.env.GLOBAL}">${process.env.APP_NAME}</a></p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};


exports.servicePausedHtml = (orgName, planName, resumeDate) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Service Paused</title>
    <style>
      .text-c { text-align: center; }
      p { color: #000; }
      .email-wrapper { background-color: #f5f5f5; width: 100%; }
      .content-wrapper { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-top: 5px solid #c0392b; }
      .logo { text-align: center; margin-bottom: 10px; }
      .logo img { max-width: 150px; }
      .highlight { color: #c0392b; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="content-wrapper">
        <div class="logo">
          <img src="${process.env.APP}${process.env.LOGO}" alt="logo" />
          <h4>${process.env.APP_NAME}</h4>
        </div>
        <div style="padding: 10px 15px;">
          <p>This is to inform you that the ${planName} service for <span class="highlight">${orgName}</span> has been <span class="highlight">paused</span> due to exceeding the allowed usage limits or based on your current plan's restrictions.</p>
          <p>The service is scheduled to automatically resume on <span class="highlight">${resumeDate}</span>.</p>
          <p>Regards,<br/>
          <a href="${process.env.GLOBAL}">${process.env.APP_NAME}</a></p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};


exports.serviceResumedHtml = (orgName, planName) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Service Resumed</title>
    <style>
      .text-c { text-align: center; }
      p { color: #000; }
      .email-wrapper { background-color: #f5f5f5; width: 100%; }
      .content-wrapper { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-top: 5px solid #27ae60; }
      .logo { text-align: center; margin-bottom: 10px; }
      .logo img { max-width: 150px; }
      .highlight { color: #27ae60; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="email-wrapper">
      <div class="content-wrapper">
        <div class="logo">
          <img src="${process.env.APP}${process.env.LOGO}" alt="logo" />
          <h4>${process.env.APP_NAME}</h4>
        </div>
        <div style="padding: 10px 15px;">
          <p>We are pleased to inform you that the ${planName} service for <span class="highlight">${orgName}</span> has been successfully <span class="highlight">resumed</span>.</p>
          <p>All features and operations are now fully available based on your current subscription.</p>
          <p>If you have any questions or require support, please feel free to contact us.</p>
          <p>Regards,<br/>
          <a href="${process.env.GLOBAL}">${process.env.APP_NAME}</a></p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

