// Author: Gururaj
// Created: 23rd Jan 2026
// Description: initializes the redis connection
// Version: 1.0.0

const Redis = require("ioredis");

const { REDIS_CONNECTION } = require('./config');

const redis = new Redis({
  ...REDIS_CONNECTION,
  retryStrategy(times) {
    if (times > 10) return null; // stop retrying
    return times * 100;
  }
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error", err);
});

module.exports = redis;
