// Author: Gururaj
// Created: 16th May 2025
// Description: This is the mail service that handles sending emails.
// Version: 1.0.0
// Modified:

// services/MailService.js
const nodemailer = require("nodemailer");
const emailTemplates = require("../template/email");
require("dotenv").config();

class MailService {
  static async sendMail(to, type, payload) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MAIL_ADDRESS,
          pass: process.env.MAIL_PASSWORD,
        },
      });

      const { subject, html } = MailService.getHtml(type, payload);

      const mailOptions = {
        from: process.env.MAIL_ADDRESS,
        to,
        subject,
        html,
      };

      return await transporter.sendMail(mailOptions);
    } catch (error) {
      // console.log('Failed to send mail', error);
      throw new Error("Failed to send mail");
    }
  }

  static getHtml(type, payload) {
    switch (type) {
      case "user.credentials":
        return {
          subject: "Your Account Credentials",
          html: emailTemplates.credentialsHtml(
            payload.name,
            payload.loginName,
            payload.loginPassword
          ),
        };
      case "user.welcome":
        return {
          subject: "Welcome to Our App!",
          html: emailTemplates.welcomeHtml(payload.name, payload.email),
        };

      case "user.forgot":
        return {
          subject: "Reset password mail",
          html: emailTemplates.forgotPassword(payload.name, payload.link),
        };
      default:
        throw new Error("Unknown email type");
    }
  }
}

module.exports = MailService;
