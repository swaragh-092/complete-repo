// config/sequelize.config.js


// not for production, just to create migration file
module.exports = {
  development: {
    username: "postgres",
    password: "postgres",
    database: "sequelize_cli",
    host: "127.0.0.1",
    dialect: "postgres",
    logging: false,
  }
};

