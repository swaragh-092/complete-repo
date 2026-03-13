// Author : Gururaj
// Created: 31th July 2025
// Description: This is constriaints or anythings which want to add for tables through queries not from sequilize models
// Version: 1.0.0
// Modified: 

const db = require("./");

module.exports = async function applyCustomIndexes() {
  // For Project make code unique only when not deleted.
  await db.sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_code_active_only
    ON ${db.Project.getTableName()} (code)
    WHERE deleted_at IS NULL
  `);

  await db.sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_project_user_department_active
    ON ${db.ProjectMember.getTableName()} (project_id, user_id, department_id)
    WHERE deleted_at IS NULL
  `);

  await db.sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_date_user_task
    ON ${db.DailyLog.getTableName()} (user_id, task_id, date)
    WHERE deleted_at IS NULL
  `);
  

};