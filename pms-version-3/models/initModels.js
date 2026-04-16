// Author: Gururaj
// Created: 16th May 2025
// Description: Model initialisation helper that registers models into a Sequelize instance and establishes associations.
// Version: 1.0.0
// Modified:

// models/initModels.js
const Sequelize = require("sequelize");
const commonFields = require("./util/commonFields");
require("dotenv").config();
const historyCommonFields = require("./util/historyCommonFields");
const TABLE_PREFIX = (process.env.DB_PREFIX || "pms") + "_";

module.exports = function initModels(sequelize) {
  const db = {};

  db.Sequelize = Sequelize;
  db.sequelize = sequelize;

  // project
  db.Project = require("./project/Project.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );

  db.Board = require("./project/Board.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );

  db.BoardColumn = require("./project/BoardColumn.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );
  db.Sprint = require("./project/Sprint.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );

  db.ProjectFeature = require("./project/ProjectFeature.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );

  db.ProjectMember = require("./project/ProjectMember.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );

  // feature
  db.Feature = require("./feature/Feature.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );

  // issues
  db.Issue = require("./issue/Issue.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );
  db.IssueHistory = require("./issue/IssueHistory.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );
  db.IssueComment = require("./issue/IssueComment.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );
  db.IssueAttachment = require("./issue/IssueAttachment.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );
  db.IssueStats = require("./issue/IssueStats.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );
  db.IssueType = require("./issue/IssueType.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );

  // issue statuses and labels
  db.IssueStatus = require("./issue/IssueStatus.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );
  db.IssueTransition = require("./issue/IssueTransition.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );
  db.IssueLabel = require("./issue/IssueLabel.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );
  db.EntityLabel = require("./issue/EntityLabel.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );

  // user story (Feature → User Stories → Sub User Stories)
  db.UserStory = require("./userStory/UserStory.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );

  // user story dependency join table
  db.UserStoryDependency = require("./userStory/UserStoryDependency.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
  );

  // story change requests (due date / status revert approval)
  db.StoryChangeRequest = require("./userStory/StoryChangeRequest.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );

  // work logs (timer session tracking)
  db.WorkLog = require("./workLog/WorkLog.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );

  // notification
  db.Notification = require("./notification/Notification")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );

  // notification
  db.NotificationRead = require("./notification/NotificationRead.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    commonFields,
  );

  // overall
  db.AuditLog = require("./overall/AuditLog.model")(
    sequelize,
    Sequelize.DataTypes,
    TABLE_PREFIX,
    historyCommonFields,
  );

  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  return db;
};
