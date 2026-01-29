const { Sequelize } = require('sequelize');
const config = require('./config.json');
const Invitation = require('../models/Invitation');
const env = process.env.NODE_ENV || 'development';
const fileConfig = config[env] || {};

// ════════════════════════════════════════════════════════
// Database Configuration
// Priority: Environment Variables > config.json > Defaults
// ════════════════════════════════════════════════════════
const dbConfig = {
  host: process.env.DB_HOST || fileConfig.host || 'localhost',
  port: parseInt(process.env.DB_PORT || fileConfig.port || 5432),
  database: process.env.DB_NAME || fileConfig.database || 'authzotion_db',
  username: process.env.DB_USER || fileConfig.username || 'postgres',
  password: process.env.DB_PASSWORD || fileConfig.password || 'postgres',
  dialect: fileConfig.dialect || 'postgres',
};

console.log(`📦 Database: Connecting to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database} as ${dbConfig.username}`);

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: dbConfig.dialect,
  logging: env === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const db = {
  sequelize,
  Sequelize,

  // ✅ FIXED: Correct file references
  Realm: require('../models/realm')(sequelize),
  Client: require('../models/client')(sequelize),
  AuditLog: require('../models/audit_log')(sequelize),
  TenantMapping: require('../models/tenant_mapping')(sequelize),  // ✅ FIXED: tenent -> tenant
  UserMetadata: require('../models/user_metadata')(sequelize),    // ✅ FIXED: removed .model
  ClientRequest: require('../models/client_requests')(sequelize),
  Organization: require('../models/Organization')(sequelize),
  OrganizationMembership: require('../models/OrganizationMembership')(sequelize),
  Role: require('../models/Roles')(sequelize),
  Permission: require('../models/Permissions')(sequelize),
  RolePermission: require('../models/RolePermission')(sequelize),
  ClientPolicy: require('../models/ClientPolicy')(sequelize), // Added ClientPolicy model
  PendingInvitation: require('../models/PendingInvitation')(sequelize), // Added PendingInvitation model
  Invitation: require('../models/Invitation')(sequelize), // 
  // Added Invitation model
  FederatedIdentityMapping: require('../models/FederatedIdentityMapping')(sequelize), // Added FederatedIdentityMapping model
  TrustedDevice: require('../models/TrustedDevice')(sequelize), // Added TrustedDevice model
  Policy: require('../models/Policy')(sequelize), // ABAC Policy model
  Relationship: require('../models/Relationship')(sequelize), // ReBAC Relationship model
  ResourceAttribute: require('../models/ResourceAttribute')(sequelize), // Resource attributes for ABAC
  RefreshToken: require('../models/RefreshToken')(sequelize), // Refresh token storage
  Workspace: require('../models/Workspace')(sequelize), // Workspace model
  WorkspaceMembership: require('../models/WorkspaceMembership')(sequelize), // Workspace membership model
  WorkspaceInvitation: require('../models/WorkspaceInvitation')(sequelize), // Workspace invitation model
};

Object.values(db).forEach(model => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;