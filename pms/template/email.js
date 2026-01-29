// Author: Gururaj
// Created: 16th May 2025
// Description: This is to keep all the email templates
// Version: 1.0.0
// Modified: gururaj at 26th May 2025,added forgotpassword email template

require('dotenv').config();

const path = require('path');


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

exports.welcomeHtml = (name) => {
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
                        <p>Welcome welcom welcome</p>
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


exports.forgotPassword = (name, link) => {
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
                        <p>Link to reset password : ${link}</p>
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

