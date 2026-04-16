"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("pms_issue_types", "hierarchy_level", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 2,
      comment: "1=Epic, 2=Story, 3=Task/Subtask",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("pms_issue_types", "hierarchy_level", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 3,
      comment: "1=Epic, 2=Story, 3=Task/Subtask",
    });
  },
};
