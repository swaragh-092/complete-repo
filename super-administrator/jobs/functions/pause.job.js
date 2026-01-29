// Author: Gururaj
// Created: 31th July 2025
// Description: This is the job where to pause and unpause the subscription based on the dates already assigned
// Version: 1.0.0

const { Op } = require('sequelize');
const { SubscriptionPause, OrganizationSubscription, } = require('../../models');
const MailJob = require('../MailJob');


exports.pauseSubscriptions = async () => {
    const toPauseSubscription = await SubscriptionPause.findAll({
      where: {
        start_date: {
          [Op.eq]: new Date().toISOString().split('T')[0], 
        },
        is_completed : false
      },
      include: [
        {
          association: 'subscription', 
          include: ['organization', 'plan'], 
        },
      ],
    });

    const pauseIds = toPauseSubscription.map(p => p.id);
    const subscriptionIds = toPauseSubscription
      .filter(p => p.subscription)
      .map(p => p.subscription.id);


    await SubscriptionPause.update(
      { is_active: true },
      { where: { id: { [Op.in]: pauseIds } } }
    );

    await OrganizationSubscription.update(
      { in_pause: true },
      { where: { id: { [Op.in]: subscriptionIds } } }
    );


    // Send email to each organization
    for (const pause of toPauseSubscription) {
      const subscription = pause.subscription;

      if (
        subscription &&
        subscription.organization &&
        subscription.organization.email &&
        subscription.plan &&
        pause.end_date
      ) {
        const resumeDate = new Date(pause.end_date);
        resumeDate.setDate(resumeDate.getDate() + 1);


        MailJob.dispatch(
          subscription.organization.email,
          'service.pause',
          {
            orgName: subscription.organization.name,
            planName: subscription.plan.name,
            resumeDate: resumeDate.toISOString().split('T')[0], // formatted YYYY-MM-DD
          }
        );
      }
    }
}


exports.unpauseSubscriptions = async () => {
  const toUnpauseSubscription = await SubscriptionPause.findAll({
    where: {
      end_date: {
        [Op.eq]: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
      },
      is_completed : false
    },
    include: [
      {
        association: 'subscription',
        include: ['organization', 'plan'],
      },
    ],
  });

  const pauseIds = toUnpauseSubscription.map(p => p.id);
  const subscriptionIds = toUnpauseSubscription
    .filter(p => p.subscription)
    .map(p => p.subscription.id);

  // Update pause records
  await SubscriptionPause.update(
    { is_active: false, is_completed : true },
    { where: { id: { [Op.in]: pauseIds } } }
  );

  // Unpause subscriptions
  await OrganizationSubscription.update(
    { in_pause: false },
    { where: { id: { [Op.in]: subscriptionIds } } }
  );

  // Send email to each organization
  for (const pause of toUnpauseSubscription) {
    const subscription = pause.subscription;

    if (
      subscription &&
      subscription.organization &&
      subscription.organization.email &&
      subscription.plan
    ) {
      MailJob.dispatch(
        subscription.organization.email,
        'service.resume',
        {
          orgName: subscription.organization.name,
          planName: subscription.plan.name,
        }
      );
    }
  }
};
