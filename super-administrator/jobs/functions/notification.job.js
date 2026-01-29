// Author: Gururaj
// Created: 31th July 2025
// Description: funciton to send notification of crossing orgnization resource usage limits and subscription
// Version: 1.0.0

const { Op } = require('sequelize');
const { UsageNotificationSetting, OrganizationUsageLimits, Organization, OrganizationSubscription, GlobalSetting } = require('../../models');
const MailJob = require('../MailJob');


exports.sendNotifications = async () => {

  // resource usage notification.
  const allSettings = await UsageNotificationSetting.findAll({
    where: { enabled: true },
    raw: true,
  });

  // all organization to send notification.
  const allOrganizations = await Organization.findAll({
    include: [{ model: OrganizationUsageLimits, as: 'usage' }],
    raw: true,
    nest: true,
  });

  // looping thorugh org and sending the notification for every
  for (const org of allOrganizations) {
    const usage = org.usage;

    if (!usage) {continue};

    for (const setting of allSettings) {
      let limit = 0;
      let used = 0;

      switch (setting.category) {
        case 'user':
          if (!usage.user_limit) continue;
          limit = usage.user_limit;
          used = usage.user_count;
          break;
        case 'storage':
          if (!usage.storage_limit_mb) continue;
          limit = usage.storage_limit_mb;
          used = usage.storage_usage_mb;
          break;
        case 'db':
          if (!usage.db_limit_mb) continue;
          limit = usage.db_limit_mb;
          used = usage.db_usage_mb;
          break;
        case 'email':
          if (!usage.email_limit) continue;
          limit = usage.email_limit;
          used = usage.email_usage;
          break;
        case 'sms':
          if (!usage.sms_limit) continue;
          limit = usage.sms_limit;
          used = usage.sms_usage;
          break;
        default:
          continue;
      }

      const percentUsed = (used / limit) * 100;

      if (percentUsed >= setting.threshold_percent) {
        MailJob.dispatch(org.email, 'notify.usage', {
          name: org.name,
          usageType: setting.category,
          limit,
          used,
        });
      }
    }
  }


  // Notification for subscription expiry
  const informDaysSettings = await GlobalSetting.findAll({
    where: {
      key: {
        [Op.in]: ['subscription_notify_before_expire_days', 'subscription_notify_after_expire_days'],
      },
    },
    raw: true,
  });

  const NUMBER_OF_DAYS_BEFORE_EXPIRY = parseInt( informDaysSettings.find(s => s.key === 'subscription_notify_before_expire_days')?.value) || 7;
  const NUMBER_OF_DAYS_AFTER_EXPIRY = parseInt( informDaysSettings.find(s => s.key === 'subscription_notify_after_expire_days')?.value ) || 7;

  const organizationsSubscriptions = await OrganizationSubscription.findAll({
    where: {
      status: {
        [Op.in]: ['active', 'trial', 'expired'],
      },
      next_sub_id : null,
      next_renewal_date: {
        [Op.between]: [
          new Date(new Date().setDate(new Date().getDate() - NUMBER_OF_DAYS_BEFORE_EXPIRY)),
          new Date(new Date().setDate(new Date().getDate() + NUMBER_OF_DAYS_AFTER_EXPIRY)),
        ],
      },
    },
    include:["plan"],
    raw: false,
  });

  // looping through every subscription 
  for (const subscription of organizationsSubscriptions) {

    const newerExists = await OrganizationSubscription.findOne({
      where: {
        organization_id: subscription.organization_id,
        plan_id: subscription.plan_id,
        status: { [Op.in]: ['active', 'trial'] },
        created_at: { [Op.gt]: subscription.created_at },
      },
    });

    if (newerExists) continue;
        
    const organization = orgMap.get(subscription.organization_id);

    const mailIdentifyString = (subscription.status === "active" || subscription.status === "trial" )  ? 'notify.expire' : 'notify.expired';
    MailJob.dispatch(organization.email, mailIdentifyString, {
          orgName : organization.name,
          planName : subscription.plan?.name || 'Plan',
          expiryDate : subscription.end_date,
          subscriptionType : subscription.status === "trial" ? "Trial": "Subscription"
        });
      
  }


}


