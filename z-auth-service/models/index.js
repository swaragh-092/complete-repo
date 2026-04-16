'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], {
    dialect: 'postgres',
    dialectOptions: { ssl: { rejectUnauthorized: false } },
  });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: 'postgres',
    dialectOptions: { ssl: { rejectUnauthorized: false } },
  });
}

// Explicitly load models in dependency order
const modelFiles = [
  'realm.js',
  'client.js',
  'audit_log.js',
  'tenent_mapping.js',
  'user_metadata.model.js',
];

modelFiles
  .filter(file => fs.existsSync(path.join(__dirname, file)))
  .forEach(file => {
    console.log(`Loading model file: ${file}`);
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    console.log(`Associating model: ${modelName}`);
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;