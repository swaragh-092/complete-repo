// Author: Gururaj
// Created: 16th May 2025
// Description: This file is to send mail using queue system.
// Version: 1.0.0
// Modified:

// jobs/MailJob.js
const MailQueue = require("../models").MailQueue;
const MailService = require("../services/MailService");

const { decrypt, encrypt } = require("../util/crypto");

class MailJob {
  // Dispatch job into the queue (insert into MySQL table)
  static async dispatch(to, type, payload) {
    await MailQueue.create({
      to_email: to,
      type: type,
      payload: encrypt(payload),
      status: "pending",
    });
  }

  // Process queued jobs and send emails
  static async processQueue() {
    const jobs = await MailQueue.findAll({
      where: { status: "pending" },
      limit: 5, // Limit to 5 emails at a time
    });

    for (const job of jobs) {
      try {
        const payload = decrypt(job.payload);
        await MailService.sendMail(job.to_email, job.type, payload);

        await MailQueue.update({ status: "sent" }, { where: { id: job.id } });
      } catch (err) {
        console.error("Failed to send job ID:", job.id, err);
        await MailQueue.update(
          { status: "failed", last_error: err.message, tries: job.tries + 1 },
          { where: { id: job.id } }
        );
      }
    }
  }
}

module.exports = MailJob;
