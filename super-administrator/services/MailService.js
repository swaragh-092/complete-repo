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
    } catch {
      // console.log('Failed to send mail', error);
      throw new Error("Failed to send mail");
    }
  }

  static getHtml(type, payload) {
    switch (type) {
      case "notify.usage":
        return {
          subject: "!Usage alert",
          html: emailTemplates.usageThresholdHtml(
            payload.name,
            payload.usageType,
            payload.limit,
            payload.used,
          ),
        };
      case "notify.expired":
        return {
          subject: "!Usage alert",
          html: emailTemplates.subscriptionExpiredHtml(
            payload.orgName,
            payload.planName,
            payload.expiryDate,
            payload.subscriptionType
          ),
        };
      case "notify.expire":
        return {
          subject: "!Usage alert",
          html: emailTemplates.subscriptionWillExpireHtml(
            payload.orgName,
            payload.planName,
            payload.expiryDate,
            payload.subscriptionType
          ),
        };
      case "service.pause":
        return {
          subject: "!Pause alert",
          html: emailTemplates.servicePausedHtml(
            payload.orgName,
            payload.planName,
            payload.resumeDate,
          ),
        };
      case "service.resume":
        return {
          subject: "!Pause alert",
          html: emailTemplates.serviceResumedHtml(
            payload.orgName,
            payload.planName,
          ),
        };
      
      
      default:
        throw new Error("Unknown email type");
    }
  }
}

module.exports = MailService;
