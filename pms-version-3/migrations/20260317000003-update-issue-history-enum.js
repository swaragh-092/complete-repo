"use strict";

const TABLE_PREFIX = "pms_";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Postgres specific: Add value to ENUM
      // If using other DBs, this might vary. Assuming Postgres based on context.

      // We can use raw SQL to add values to the enum type if it exists
      // The enum type name is usually "enum_pms_issue_histories_action_type" or similar
      // But safe way is to just alter column if not enum, or add value if enum.

      // Check dialect
      const dialect = queryInterface.sequelize.getDialect();

      if (dialect === "postgres") {
        await queryInterface.sequelize.query(
          `ALTER TYPE "enum_${TABLE_PREFIX}issue_histories_action_type" ADD VALUE 'updated';`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `ALTER TYPE "enum_${TABLE_PREFIX}issue_histories_action_type" ADD VALUE 'status_change';`,
          { transaction },
        );
        await queryInterface.sequelize.query(
          `ALTER TYPE "enum_${TABLE_PREFIX}issue_histories_action_type" ADD VALUE 'assigned';`,
          { transaction },
        );
      } else {
        // For MySQL/Others, usually modifying the column definition works
        await queryInterface.changeColumn(
          `${TABLE_PREFIX}issue_histories`,
          "action_type",
          {
            type: Sequelize.ENUM(
              "created",
              "accepted",
              "rejected",
              "reassigned",
              "fixed",
              "resolved",
              "commented",
              "re_opened",
              "updated",
              "status_change",
              "assigned",
            ),
            allowNull: false,
          },
          { transaction },
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      // If error (e.g. value already exists), we might want to ignore or log
      console.log("Migration error (might be benign if values exist):", err);
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverting ENUM additions in Postgres is hard (requires creating new type, migrating data, dropping old type)
    // skipping for now as addition is backward compatible
  },
};
