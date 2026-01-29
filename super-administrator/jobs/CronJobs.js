// Author: Gururaj
// Created: 16th May 2025
// Description: This is to keep run all cron jobs in background.
// Version: 1.0.0
// Modified:  16th May 2025 by Chethan, added cron job to delete old login attempts

const cron = require("node-cron");
const { sendNotifications } = require("./functions/notification.job");
const { pauseSubscriptions, unpauseSubscriptions } = require("./functions/pause.job");
const { subscriptionExpire, subscriptionPushToHistory } = require("./functions/subscribe.job");
const { usageHistoryCreation } = require("./functions/usageHistory.job");


cron.schedule('0 6 * * *', async () => {

    try {
        await sendNotifications();
    } catch {
        console.log("failed to send Notifications");
    }
});


cron.schedule('0 0 * * *', async () => {

    try {
        await unpauseSubscriptions();
    }catch {
        console.log("failed to un pause subscriptions");
    }

    try {
        await pauseSubscriptions();
    }catch {
        console.log("failed to pause subscriptions");
    }
    try {
        await subscriptionExpire();
    }catch {
        console.log("failed to subscription Expire");
    }
    try {
        await subscriptionPushToHistory();
    }catch {
        console.log("failed to subscription push to history");
    }





});


cron.schedule('0 0 1 * *', async () => {
    try {
        await usageHistoryCreation();
    }catch{
        console.log("failed to send Notifications");
    }
    
});







// // // Cron expression: Every 10 minutes
// cron.schedule('*/10 * * * *', () => {
//     console.log('Job for every 10 min working at ', new Date().toLocaleString());
// });

