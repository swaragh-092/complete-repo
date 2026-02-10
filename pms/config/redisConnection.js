// Author: Gururaj
// Created: 23rd Jan 2026
// Description: initializes the redis connection
// Version: 1.0.0

const Redis = require("ioredis");

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
}
console.log(redisConfig);

const redis = new Redis({
  ...redisConfig,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  }
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error", err);
});

module.exports = redis;
