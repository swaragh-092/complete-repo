"use strict";

const TABLE_PREFIX = process.env.DB_PREFIX || "pms";
const ENUM_NAME = `enum_${TABLE_PREFIX}_user_stories_status`;

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "${ENUM_NAME}" ADD VALUE IF NOT EXISTS 'review';`,
    );
  },

  async down() {
    // PostgreSQL does not support removing enum values directly.
    // A full recreation of the enum type would be required, which is risky.
    // This is intentionally left as a no-op.
  },
};
