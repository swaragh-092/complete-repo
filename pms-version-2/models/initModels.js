// models/initModels.js
const Sequelize = require("sequelize");
const commonFields = require("./util/commonFields");
require("dotenv").config();
const historyCommonFields = require("./util/historyCommonFields");
const TABLE_PREFIX = process.env.DB_PREFIX + "_";

module.exports = function initModels(sequelize) {
    
    
    const db = {};
    
    db.Sequelize = Sequelize;
    db.sequelize = sequelize;

    // project
    db.Project = require("./project/Project.model")(
        sequelize,
        Sequelize.DataTypes,
        TABLE_PREFIX,
        commonFields
    );

    db.ProjectFeature = require("./project/ProjectFeature.model")(
        sequelize,
        Sequelize.DataTypes,
        TABLE_PREFIX,
        commonFields
    );

    db.ProjectMember = require("./project/ProjectMember.model")(
        sequelize,
        Sequelize.DataTypes,
        TABLE_PREFIX,
        commonFields
    );

    // feature
    db.Feature = require("./feature/Feature.model")(
        sequelize,
        Sequelize.DataTypes,
        TABLE_PREFIX,
        commonFields
    );

    // checklist
    db.Checklist = require("./checklist/Checklist.model")(
        sequelize,
        Sequelize.DataTypes,
        TABLE_PREFIX,
        commonFields
    );

    // issues
    db.Issue = require("./issue/Issue.model")(
        sequelize,
        Sequelize.DataTypes,
        TABLE_PREFIX,
        commonFields
    );
    db.IssueHistory = require("./issue/IssueHistory.model")(
        sequelize,
        Sequelize.DataTypes,
        TABLE_PREFIX,
        commonFields
    );
    db.IssueStats = require("./issue/IssueStats.model")(
        sequelize,
        Sequelize.DataTypes,
        TABLE_PREFIX,
        commonFields
    );
    db.IssueType = require("./issue/IssueType.model")(
        sequelize,
        Sequelize.DataTypes,
        TABLE_PREFIX,
        commonFields
    );



    // task
    db.Task = require("./task/Task.model")(
        sequelize,
        Sequelize.DataTypes,
        TABLE_PREFIX,
        commonFields
    );
    db.TaskDependency = require("./task/TaskDependency.model")(
        sequelize,
        Sequelize.DataTypes,
        TABLE_PREFIX,
        commonFields
    );


    // daily log (standup and wrapup)
    db.DailyLog = require("./Dailylog/DailyLog.model")(
        sequelize,
        Sequelize.DataTypes,
        TABLE_PREFIX,
        commonFields
    );
    
    // notification 
    db.Notification = require("./notification/Notification")(
        sequelize,
        Sequelize.DataTypes,
        TABLE_PREFIX,
        commonFields
    );

    // notification 
    db.NotificationRead = require("./notification/NotificationRead.model")(
        sequelize,
        Sequelize.DataTypes,
        TABLE_PREFIX,
        commonFields
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
