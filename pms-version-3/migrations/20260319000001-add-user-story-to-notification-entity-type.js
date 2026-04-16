'use strict';

module.exports = {
  async up(queryInterface) {
    // Add 'user_story' to the enum_pms_notifications_entity_type enum
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_pms_notifications_entity_type" ADD VALUE IF NOT EXISTS 'user_story'`
    );
  },

  async down() {
    // PostgreSQL does not support removing enum values without recreating the type.
    // Intentionally left as no-op.
  },
};
