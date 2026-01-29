// Author: Gururaj
// Created: 16th May 2025
// Description: This is to keep run all cron jobs in background.
// Version: 1.0.0
// Modified:  

const cron = require("node-cron");

const { autoEndAllTasks,  generateDailyLogs } = require("./services/jobServices");
const {databaseDetails} = require('../config/config');
const { getTenantSequelize } = require("../config/databaseConfig");

cron.schedule("0 21 * * *", async () => {
  console.log("Job running for end left off tasks and to generate wrapup at", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));

  for (const dbKey in databaseDetails) {
    const database = await getTenantSequelize(dbKey);

    const sequelize = database.sequelize;
    const models = database.modules;

    try {
      await autoEndAllTasks(sequelize, models);
      await generateDailyLogs(sequelize, models);
    } catch (err) {
      console.log(`Error processing database ${dbKey}:`, err);
    }

  }
    
  
}, {
  timezone: "Asia/Kolkata"
});