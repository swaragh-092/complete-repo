// Author: Gururaj
// Created: 16th May 2025
// Description: This file contains the queue processor for handling background jobs.
// Version: 1.0.0
// Modified: 


const MailJob = require('../jobs/MailJob');

async function runQueue() {
  await MailJob.processQueue();
}

// Process the queue every 30 seconds
setInterval(runQueue, 30000); // Adjust the interval as needed
