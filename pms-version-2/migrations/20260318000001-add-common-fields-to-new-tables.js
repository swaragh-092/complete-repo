"use strict";

const TABLE_PREFIX = "pms_";

// All tables created without the standard common fields
const TABLES = [
  `${TABLE_PREFIX}sprints`,
  `${TABLE_PREFIX}boards`,
  `${TABLE_PREFIX}board_columns`,
  `${TABLE_PREFIX}issue_transitions`,
  `${TABLE_PREFIX}issue_comments`,
  `${TABLE_PREFIX}issue_attachments`,
  `${TABLE_PREFIX}issue_statuses`,
  `${TABLE_PREFIX}issue_labels`,
  `${TABLE_PREFIX}entity_labels`,
];

const COMMON_COLUMNS = {
  organization_id: {
    type: "UUID",
    allowNull: true,
  },
  created_by: {
    type: "UUID",
    allowNull: true,
  },
  updated_by: {
    type: "UUID",
    allowNull: true,
  },
  created_ip: {
    type: "STRING(45)",
    allowNull: true,
  },
  updated_ip: {
    type: "STRING(45)",
    allowNull: true,
  },
  created_user_agent: {
    type: "STRING(255)",
    allowNull: true,
  },
  updated_user_agent: {
    type: "STRING(255)",
    allowNull: true,
  },
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const table of TABLES) {
        // Check which columns already exist
        const tableDesc = await queryInterface.describeTable(table);

        for (const [colName, colDef] of Object.entries(COMMON_COLUMNS)) {
          if (!tableDesc[colName]) {
            const seqType =
              colDef.type === "UUID"
                ? Sequelize.UUID
                : colDef.type === "STRING(45)"
                  ? Sequelize.STRING(45)
                  : Sequelize.STRING(255);

            await queryInterface.addColumn(
              table,
              colName,
              { type: seqType, allowNull: true },
              { transaction },
            );
          }
        }

        // Also ensure deleted_at exists (some tables may lack it)
        if (!tableDesc["deleted_at"]) {
          await queryInterface.addColumn(
            table,
            "deleted_at",
            { type: Sequelize.DATE, allowNull: true },
            { transaction },
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const table of TABLES) {
        const tableDesc = await queryInterface.describeTable(table);
        for (const colName of Object.keys(COMMON_COLUMNS)) {
          if (tableDesc[colName]) {
            await queryInterface.removeColumn(table, colName, { transaction });
          }
        }
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
