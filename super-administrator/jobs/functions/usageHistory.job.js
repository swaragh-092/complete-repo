// Author: Gururaj
// Created: 31th July 2025
// Description: This is to create usage as history.
// Version: 1.0.0

const { OrganizationUsageLimits, OrganizationUsageHistory } = require("../../models");
const moment = require("moment");

exports.usageHistoryCreation = async () => {
  const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");
  const today = moment().format("YYYY-MM-DD");


  const allUsageLimits = await OrganizationUsageLimits.findAll({ raw: true });

  const historyData = allUsageLimits.map((usage) => ({
    organization_id: usage.organization_id,
    from_date: usage.from_data,
    to_date: yesterday,
    user_count: usage.user_count,
    user_limit: usage.user_limit,
    storage_usage_mb: usage.storage_usage_mb,
    storage_limit_mb: usage.storage_limit_mb,
    db_usage_mb: usage.db_usage_mb,
    db_limit_mb: usage.db_limit_mb,
    sms_usage: usage.sms_usage,
    sms_limit: usage.sms_limit,
    total_sms_usage: usage.total_sms_usage,
    email_usage: usage.email_usage,
    email_limit: usage.email_limit,
    total_email_usage: usage.total_email_usage,
    api_requests: usage.api_requests,
    api_requests_limit: usage.api_requests_limit,
    total_api_requests: usage.total_api_requests,
  }));

  // Bulk insert into history table
  if (historyData.length > 0) {
    await OrganizationUsageHistory.bulkCreate(historyData);
  }

  // Bulk reset usage counters
  await OrganizationUsageLimits.update(
    {
      sms_usage: 0,
      email_usage: 0,
      api_requests: 0,
      from_data: today,
    },
    {
      where: {},
    }
  );
};
