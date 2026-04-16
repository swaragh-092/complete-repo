// Author: Gururaj
// Created: 23rd Jan 2026
// Description: initializes the redis connection
// Version: 1.0.0

const Redis = require("ioredis");
const { REDIS_CONNECTION } = require("./config");

let redis = null;

function getRedis() {
  // 🔥 Do not connect in test
  // if (process.env.NODE_ENV === "test") {
  //   return null;
  // }

  if (!redis) {
    redis = new Redis({
      ...REDIS_CONNECTION,
      retryStrategy(times) {
        if (times > 10) return null;
        return times * 100;
      },
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected");
    });

    redis.on("error", (err) => {
      console.error("❌ Redis error", err);
    });
  }

  return redis;
}

async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

module.exports = {
  getRedis,
  closeRedis,
};