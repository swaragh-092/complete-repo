// Author: Chethan
// Created: 16th May 2025
// Description: Rate limiter service for login attempts
// Version: 1.0.0
// Modified:

const StatusService = require("../status.service");
const { withContext } = require("../../util/helper");

class RateLimiter {
  constructor(maxCount = 5, windowMinutes = 15) {
    this.maxCount = maxCount;
    this.windowMinutes = windowMinutes;
  }
  async isRateLimited(email, ip, context = {}) {
    const { req, db } = context;

    const sinceTime = new Date(Date.now() - this.windowMinutes * 60 * 1000);
    const failedStatus = await StatusService.getStatusByfields(
      { name: "failed", used_for: "user" },
      null,
      { db }
    );

    if (!failedStatus) {
      throw new Error("unable to find status");
    }
    const attemptCount = await db.LoginAttempt.count(
      {
        where: {
          email,
          ip,
          status_id: failedStatus.id,
          attempt_time: { [db.Sequelize.Op.gte]: sinceTime },
        },
      },
      withContext(req)
    );

    return attemptCount >= this.maxCount;
  }

  async createLogAttempt(email, ip, context = {}) {
    const { db } = context;
    const failedStatus = await StatusService.getStatusByfields(
      { name: "failed", used_for: "user" },
      null,
      { db }
    );
    const attempt = await db.LoginAttempt.create({
      email,
      ip,
      status_id: failedStatus.id,
      attempt_time: new Date(),
    });

    return attempt;
  }
}

module.exports = RateLimiter;
