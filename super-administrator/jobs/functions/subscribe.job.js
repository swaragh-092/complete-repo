// Author: Gururaj
// Created: 31th July 2025
// Description: This is the job where it updated the subscrition to expired or active and move to history of old subsciption.
// Version: 1.0.0

const { Op } = require('sequelize');
const { OrganizationSubscription, OrganizationSubscriptionCompleted, GlobalSetting } = require("../../models");
const { getEndDataBasedOnBillingCycle } = require('../../services/subscription/subscription.service');

exports.subscriptionExpire = async () => {
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0];

  const organizationSubscribes = await OrganizationSubscription.findAll({
    where: {
      end_date: {
        [Op.eq]: yesterday,
      },
      status: ['active', 'trial',],
    },
    include: ['organization', 'plan', 'next_subscription'],
  });

  const subscriptionIds = organizationSubscribes.map(sub => sub.id);


  for (const subscription of organizationSubscribes) {
    const nextSub = subscription.next_subscription;

    if (!nextSub) continue;

    const start_date = new Date(new Date(subscription.end_date).setDate(new Date(subscription.end_date).getDate() + 1)).toISOString().split('T')[0];
    const end_date = getEndDataBasedOnBillingCycle(nextSub.billing_cycle, start_date);

    await nextSub.update({
      status : "active",
      start_date,
      end_date,
      next_renewal_date : end_date,
    });
  }
  

  // Update all to expired
  await OrganizationSubscription.update(
    { status: 'expired' },
    {
      where: {
        id: {
          [Op.in]: subscriptionIds,
        },
      },
    }
  );

};


exports.subscriptionPushToHistory = async () => {

  const informDaysSettings = await GlobalSetting.findAll({
      where: {
        key: {
          [Op.in]: ['subscription_notify_before_expire_days', 'subscription_notify_after_expire_days'],
        },
      },
      raw: true,
    });
  
    
    const NUMBER_OF_DAYS_AFTER_EXPIRY = parseInt( informDaysSettings.find(s => s.key === 'subscription_notify_after_expire_days')?.value,  10 ) || 7;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + NUMBER_OF_DAYS_AFTER_EXPIRY);

    const expiredSubscriptions = await OrganizationSubscription.findAll({
      where: {
        status: {
          [Op.in]: ['expired', 'cancelled', "failed", "activate_pending"],
        },
        end_date: {
          [Op.gt]: cutoffDate,
        },
      },
      raw: false,
    });

    if (expiredSubscriptions.length > 0) {
      // Extract plain data
      const plainData = expiredSubscriptions.map(s => s.get({ plain: true }));

      // Insert into history table
      await OrganizationSubscriptionCompleted.bulkCreate(plainData);

      // Delete from original table
      const ids = plainData.map(s => s.id);
      await OrganizationSubscription.destroy({ where: { id: ids } });
    }

}

    
