// Author : Gururaj
// Created: 31th July 2025
// Description: This is constriaints or anythings which want to add for tables through queries not from sequilize models
// Version: 1.0.0
// Modified: 

const db = require("./");

module.exports = async function applyCustomIndexes() {
  // For Organizations: Make email unique where deleted_at is null
  await db.sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_email_active_only
    ON ${db.Organization.getTableName()} (email)
    WHERE deleted_at IS NULL
  `);

  await db.sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_phone_active_only
    ON ${db.Organization.getTableName()} (phone)
    WHERE deleted_at IS NULL
  `);

  await db.sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_module_feature_active_only
    ON ${db.ModuleFeature.getTableName()} (module_id, module_version_id, code)
    WHERE deleted_at IS NULL
  `);

  await db.sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS unique_key_clock_id_only
    ON ${db.OrganizationAdmin.getTableName()} (keycloak_user_id)
    WHERE deleted_at IS NULL
  `);

};