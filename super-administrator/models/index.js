// Author : Gururaj
// Created: 31th July 2025
// Description: Indes page, contains allthe models and called here.
// Version: 1.0.0
// Modified: 

const Sequelize = require("sequelize");
const sequelize = require("../config/dbConnection");
const commonFields = require('./util/commonFields');
const historyCommonFields = require("./util/historyCommonFields");
require("dotenv").config();

const TABLE_PRIFIX = process.env.DB_PREFIX + "_";

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;


// Util models
db.MailQueue = require("./util/mailQueue.model")( sequelize, Sequelize.DataTypes, TABLE_PRIFIX, commonFields);

// Organization related models
db.Organization = require("./organization/Organization.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.OrganizationLocation = require("./organization/OrganizationLocation.module")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.OrganizationAdmin = require("./organization/OrganizationAdmin.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.OrganizationTrials = require("./organization/OrganizationTrials.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);

const {  default: OrganizationUsageLimits,  OrganizationUsageHistory} = require("./usage/OrganizationUsage.model");
db.OrganizationUsageLimits = OrganizationUsageLimits(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.OrganizationUsageHistory = OrganizationUsageHistory(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);

db.EmailPackage = require("./usage/EmailPackage.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.SMSPackage = require("./usage/SMS_Package.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);

db.Database = require("./host/Database.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.Codebase = require("./host/Codebase.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.Domain = require("./host/Domain")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);


 
// Mudules related models
db.ModuleRegistry = require("./module/ModuleRegistry.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.ModuleVersion = require("./module/ModuleVersion.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.ModuleFeature = require("./module/ModuleFeature.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.ModuleMaxVersion = require("./module/ModuleMaxVersion.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
// snapshots 
db.ModuleFeatureSnapshot = require("./module/project/ModuleFeatureSnapshot.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.SnapshotModule = require("./module/project/SnapshotModule.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.SnapshotModuleFeature = require("./module/project/SnapshotModuleFeature.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);

db.Project = require("./module/project/project.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);



// plan and subscription related models
db.Plan = require("./plan/Plan.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.PlanSnapshot = require("./plan/PlanSnapshot.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.PlanProject = require("./plan/PlanProject.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.PlanProjectSnapshot = require("./plan/PlanProjectSnapshot.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);

db.OrganizationSubscription = require("./subscription/OrganizationSubscription.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.OrganizationSubscriptionCompleted = require("./subscription/OrganizationSubscriptionCompleted.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.SubscriptionPause = require("./pause/SubscriptionPause.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
// db.SubscriptionPauseCompleted = require("./pause/SubscriptionPauseCompleted.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);

db.Invoice = require("./payment/Invoics.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.InvoiceCounter = require("./payment/InvoiceCounter.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.Payment = require("./payment/Payment.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);



// global models (no relation)
db.UsageNotificationSetting = require("./notification/UsageNotificationSetting.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);
db.GlobalSetting = require("./settings/GlobalSettings.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  commonFields);



module.exports.REQUIRE_HISTORY_TABLE = [
  db.Organization.getTableName(),
  db.OrganizationLocation.getTableName(),
  db.OrganizationAdmin.getTableName(),
  db.OrganizationTrials.getTableName(),
  db.OrganizationUsageHistory.getTableName(),
  db.OrganizationUsageLimits.getTableName(),
  db.EmailPackage.getTableName(),
  db.SMSPackage.getTableName(),
  db.Database.getTableName(),
  db.Codebase.getTableName(),
  db.Domain.getTableName(),
  db.ModuleRegistry.getTableName(),
  db.ModuleVersion.getTableName(),
  db.ModuleFeature.getTableName(),
  db.ModuleFeatureSnapshot.getTableName(),
  db.SnapshotModule.getTableName(),
  db.SnapshotModuleFeature.getTableName(),
  db.Plan.getTableName(),
  db.PlanSnapshot.getTableName(),
  db.PlanProject.getTableName(),
  db.PlanProjectSnapshot.getTableName(),
  db.OrganizationSubscription.getTableName(),
  db.OrganizationSubscriptionCompleted.getTableName(),
  db.SubscriptionPause.getTableName(),
  db.Project.getTableName(),
  
  db.Payment.getTableName(),
  db.Invoice.getTableName(),
  db.UsageNotificationSetting.getTableName(),
  db.GlobalSetting.getTableName(),
];
 

db.AuditLog = require("./overall/auditLog.model")(  sequelize,  Sequelize.DataTypes,  TABLE_PRIFIX,  historyCommonFields);



Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});        
      

module.exports = db;



       