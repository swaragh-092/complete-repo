// Author: Gururaj
// Created: 16th May 2025
// Description: This file contains the queue processor for handling background jobs.
// Version: 1.0.0
// Modified: 


const MailJob = require('../jobs/MailJob');

require('dotenv').config();

async function runQueue() {
  await MailJob.processQueue();
}

const mailInterval = Number(process.env.MAIL_INTERVAL) || 30;

// Process the queue every duration.
setInterval(runQueue, mailInterval * 1000);