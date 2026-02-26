module.exports = {
  development: {
    username: "postgres",
    password: "1234",
    database: "one",
    host: "db-pms",
    dialect: "postgres",
    logging: false,
  },
  test: {
    username: "postgres",
    password: "1234",
    database: "pms_test",
    host: "localhost",
    port: 5411, // or whatever port you exposed
    dialect: "postgres",
    logging: false,
  },
  production: {
    username: "postgres",
    password: "1234",
    database: "one",
    host: "db-pms",
    dialect: "postgres",
    logging: false,
  }
};
