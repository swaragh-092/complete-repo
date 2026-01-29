// Author: Gururaj
// Created: 31th July 2025
// Description: Pause service.
// Version: 1.0.0

const { OrganizationSubscription } = require("../../models");
const { withContext } = require("../../util/helper");
const { Op } = require("sequelize");
const { queryWithLogAudit } = require("../../services/auditLog.service");

module.exports = {
  // create pause for the subscrioption 
  async pauseSubscription({ data, req }) {
    const subscription = await OrganizationSubscription.findByPk(data.subscription_id);
    if (!subscription) return { success: false, status: 404, message: "Subscription not found" };
    if (subscription.status !== "active") return { success: false, status: 400, message: "Subscription is not active" };

    const startData = new Date(data.start_date);
    const endData = new Date(data.end_date);

    const existingPause = await subscription.getPauses({
      where: {
          [Op.or]: [
          {
              start_date: {
              [Op.between]: [startData, endData],
              },
          },
          {
              end_date: {
              [Op.between]: [startData, endData],
              },
          },
          {
              [Op.and]: [
              { start_date: { [Op.lte]: startData } },
              { end_date: { [Op.gte]: endData } },
              ],
          },
          ],
      },
      });

    if (existingPause.length > 0) return { success: false, status: 400, message: 'A pause already exists in the given date range', };
    
    const pauseDays = Math.ceil((endData - startData) / (1000 * 60 * 60 * 24)) + 1;
    const leftPauseDays = parseInt(subscription.pause_days_left, 10);

    if (pauseDays > leftPauseDays) return { success: false, status: 400, message: leftPauseDays > 0 ? `Pause days cannot exceed ${leftPauseDays}` : "No pause left or allowed" };

    const pauseUpdateData = { organization_id : subscription.organization_id, start_date: startData.toISOString().split('T')[0], end_date: endData.toISOString().split('T')[0], reason: data.reason, paused_by: req.user?.id };

    const endDate = new Date(subscription.end_date); endDate.setDate(endDate.getDate() + pauseDays);
    const nextRenewalDate = new Date(subscription.next_renewal_date); nextRenewalDate.setDate(nextRenewalDate.getDate() + pauseDays);

    const subscriptionUpdataData = { pause_days_left: leftPauseDays - pauseDays, end_date: endDate.toISOString().split('T')[0], next_renewal_date: nextRenewalDate.toISOString().split('T')[0], };

    //  Create Pause with Audit Log
    const newPause = await queryWithLogAudit({
      action: 'create',
      req,
      updated_columns: Object.keys(pauseUpdateData),
      queryCallBack: async (t) => {
        return await subscription.createPause(pauseUpdateData, {
          transaction: t,
          ...withContext(req),
        });
      },
    });

    // Update Subscription with Audit Log
    await queryWithLogAudit({
      action: 'update',
      req,
      updated_columns: Object.keys(subscriptionUpdataData),
      remarks : "To add the pause",
      queryCallBack: async (t) => {
        return await subscription.update(subscriptionUpdataData, {
          transaction: t,
          ...withContext(req),
        });
      },
    });

    return { success: true, status: 201, data: newPause, message: `Subscription will paused from ${newPause.start_date} to ${newPause.end_date}` };
  },

  // remove pause which already did 
  async cancelPause({ data, req }) {
    const subscription = await OrganizationSubscription.findByPk(data.subscription_id);
    if (!subscription) return { success: false, status: 404, message: "Subscription not found" };
    if (subscription.status !== "active") return { success: false, status: 400, message: "Subscription is not active" };

    const pause = await subscription.getPauses({ where: { id: data.pause_id } });
    if (!pause || pause.length === 0) return { success: false, status: 404, message: "Pause not found" };

    const pauseDays = Math.ceil((new Date(pause[0].end_date) - new Date(pause[0].start_date)) / (1000 * 60 * 60 * 24)) + 1;
    const leftPauseDays = parseInt(subscription.pause_days_left, 10);

    const endDate = new Date(subscription.end_date); endDate.setDate(endDate.getDate() - pauseDays);
    const nextRenewalDate = new Date(subscription.next_renewal_date); nextRenewalDate.setDate(nextRenewalDate.getDate() - pauseDays);

    //  Update subscription
    await queryWithLogAudit({
      action: 'update',
      req,
      updated_columns: ['pause_days_left', 'end_date', 'next_renewal_date'],
      remarks : "Added for delete pause",
      queryCallBack: async (t) => {
        return await subscription.update(
          {
            pause_days_left: leftPauseDays + pauseDays,
            end_date: endDate.toISOString().split('T')[0],
            next_renewal_date: nextRenewalDate.toISOString().split('T')[0],
          },
          { transaction: t, ...withContext(req) }
        );
      },
    });

    // Destroy pause record
    await queryWithLogAudit({
      action: 'delete',
      req,
      updated_columns: ['id'], // or any other identifier field(s) of `pause[0]`
      queryCallBack: async (t) => {
        return await pause[0].destroy({ transaction: t, ...withContext(req) });
      },
    });

    return { success: true, status: 200, message: "Pause cancelled successfully" };
  },

  // stop pasue if any pause isrunning 
  async stopPause({ data, req }) {
    const subscription = await OrganizationSubscription.findByPk(data.subscription_id);
    if (!subscription) return { success: false, status: 404, message: "Subscription not found" };
    if (subscription.status !== "active" && subscription.in_pause) return { success: false, status: 400, message: "Subscription is not in pause" };

    const pause = await subscription.getPauses({ where: { is_active: "1" } });
    if (!pause || pause.length === 0 ) return { success: false, status: 404, message: "Subscription pause is not active to stop" };

    const daysGained = Math.ceil((new Date(pause[0].end_date) - new Date()) / (1000 * 60 * 60 * 24)) + 1;  
    const endDate = new Date(subscription.end_date);
    const nextRenewalDate = new Date(subscription.next_renewal_date);

    const subscriptionChangeData = {
      in_pause : false, // Mark subscription as active
      pause_days_left : subscription.pause_days_left + daysGained, 
      end_date : endDate,
      next_renewal_date : nextRenewalDate
    };

    //  Save updated subscription
    await queryWithLogAudit({
      action: 'update',
      req,
      updated_columns: Object.keys(subscriptionChangeData), // Tracks only changed fields
      remarks : "Deleted current pause",
      queryCallBack: async (t) => {
        return await subscription.update(subscriptionChangeData, { transaction: t, ...withContext(req) });
      },
    });

    //  Destroy pause record
    await queryWithLogAudit({
      action: 'delete',
      req,
      updated_columns: ['id'], 
      queryCallBack: async (t) => {
        return await pause[0].destroy({ transaction: t, ...withContext(req) });
      },
    });
   
    return { success: true, status: 200, message: "Pause cancelled successfully" };
  }


};
