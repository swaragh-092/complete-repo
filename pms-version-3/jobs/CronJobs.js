// Author: Gururaj
// Created: 14th Oct 2025
// Description: Nightly cron jobs that auto-end overdue tasks and user-story timers at 21:00 IST.
// Version: 2.0.0
// Modified:

// Description: Background cron jobs
// Version: 2.0.0
// Modified: Removed daily log generation (daily logs module removed in v2)

const cron = require("node-cron");

const JobService = require("./services/jobServices");
const { databaseDetails } = require("../config/config");
const { getTenantSequelize } = require("../config/databaseConfig");

cron.schedule(
  "0 21 * * *",
  async () => {
    console.log(
      "Job running for end left off tasks at",
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    );

    for (const dbKey in databaseDetails) {
      const database = await getTenantSequelize(dbKey);

      const sequelize = database.sequelize;
      const models = database.modules;

      try {
        await JobService.autoEndAllTasks(sequelize, models);
      } catch (err) {
        console.log(`Error processing database ${dbKey} (tasks):`, err);
      }

      try {
        await JobService.autoEndAllUserStoryTimers(sequelize, models);
      } catch (err) {
        console.log(`Error processing database ${dbKey} (user story timers):`, err);
      }
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);
