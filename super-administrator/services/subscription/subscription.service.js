// Author: Gururaj
// Created: 31th July 2025
// Description: Subscription handle service
// Version: 1.0.0

const { OrganizationSubscription, Plan, GlobalSetting, Organization, OrganizationTrials } = require("../../models");
const { withContext } = require("../../util/helper");
const { queryWithLogAudit } = require("../auditLog.service");
const invoiceService = require("../payment/invoice.service");
const { Op } = require('sequelize');

module.exports = {

  async getEndDataBasedOnBillingCycle (billingCycle, startDate) {
    const endDate = new Date(startDate);

    switch (billingCycle) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'half-yearly':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        // fallback: assume 1 month if billing cycle is missing or invalid
        endDate.setMonth(endDate.getMonth() + 1);
      }
      return endDate.toISOString().split('T')[0];
  },


  async create({ data, req }) {
    //  Validate plan and organization
    const plan = await Plan.findByPk(data.plan_id);
    if (!plan || !plan.recent_snapshot_id ) return { success: false, status: 404, message : "Invalid Plan." };
    const organization = await Organization.findByPk(data.organization_id);
    if (!organization) return { success: false, status: 404, message : "Organization not found" };

    // Prepare base subscription data
    const subscriptionData = {organization_id : data.organization_id, plan_id: data.plan_id, snapshot_plan_id : plan.recent_snapshot_id};

    // Check for existing active/trial/feature subscriptions and get latest one
    const hasAlreadySubscribed = await OrganizationSubscription.findOne({
        where: {
          plan_id: plan.id,
          organization_id: organization.id,
          status: { [Op.in]: ['active', 'trial', "feature_subscritpion"] },
          payment : "done"
        },
        order: [['created_at', 'DESC']], // 
      });
  
    // Handle Trial Subscription Flow
    if (data.is_trial) {
      if (!plan.allow_trial) return { success: false, status: 400, message : "Trial is not available for this plan" };
      // Fetch previous trials for this org-plan combo
      const before_trials = await OrganizationTrials.findAll({where:{organization_id: data.organization_id, plan_id: data.plan_id, }});

      // Check if trial count has exceeded the allowed limit
      const trialAllowedTimes = parseInt((await GlobalSetting.findOne({ where: { key: 'trial_allowed_times', is_active: true }, attributes: ['value'], raw: true }))?.value, 10) || 1;
      if (before_trials.length > trialAllowedTimes) return { success: false, status: 400, message: "Reached Trial limit" };
      
      const trialDays = (await GlobalSetting.findOne({
          where: { key: 'trial_days' },
          attributes: ['value'],
          raw: true,
          }))?.value;
      subscriptionData.trial_days = isNaN(trialDays) ? 7 : trialDays;
      subscriptionData.status = "trial";
  
      subscriptionData.start_date = new Date().toISOString().split('T')[0];
      subscriptionData.end_date = new Date(Date.now() + (subscriptionData.trial_days  * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      subscriptionData.next_renewal_date = subscriptionData.end_date;
    } else {
      // Handle Paid Subscription Flow
      subscriptionData.status = hasAlreadySubscribed ? "feature_subscritpion" :"activate_pending";
      subscriptionData.pause_days_left = plan.pause_days;
      const billingCycle = plan.billing_cycle?.toLowerCase();
      subscriptionData.billing_cycle = billingCycle;

      // If new subscription (not resuming or upgrading), calculate billing dates
      if (!hasAlreadySubscribed) {

        const startDate = data.start_date ? new Date(data.start_date) : new Date();
        subscriptionData.start_date = startDate.toISOString().split('T')[0];
        
        subscriptionData.end_date = await this.getEndDataBasedOnBillingCycle(billingCycle, startDate);
        subscriptionData.next_renewal_date = subscriptionData.end_date;
      }      

    }


    const subscription = await queryWithLogAudit({
      req,
      action: 'create',
      queryCallBack: async (t) => await OrganizationSubscription.create(subscriptionData, { ...withContext(req), transaction: t }),
      updated_columns: Object.keys(subscriptionData),
    });


    // Link previous subscription to this one (if any)
    if (hasAlreadySubscribed) {
      hasAlreadySubscribed.next_sub_id = subscription.id;
      await queryWithLogAudit({
        req,
        action: 'update',
        queryCallBack: async (t) =>
          await hasAlreadySubscribed.save({ ...withContext(req), transaction: t }),
        updated_columns: ['next_sub_id'],
      });
    }
    // Create Invoice for this subscription (this invoice is valid for specific time based on settings)
    const invoiceResponse = await invoiceService.create({data : {plan, organization, subscription}, req});

    // Handle invoice failure
    if (!invoiceResponse.success) {
      await queryWithLogAudit({
        req,
        action: 'update',
        queryCallBack: async (t) =>
          await subscription.update({ status: 'failed' }, { ...withContext(req), transaction: t }),
        updated_columns: ['status'],
      });
      return invoiceResponse;
    }

    return { success: true, status: 201, 
      data: {invoice : invoiceResponse.data, subscription} 
    };
  },
};
