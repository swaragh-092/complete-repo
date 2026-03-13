
const { closeAllConnections } = require("../middleware/dbConnection.middleware");
const { closeRedis } = require("../config/redisConnection");

afterAll(async () => {
  await closeAllConnections();
  await closeRedis();
});