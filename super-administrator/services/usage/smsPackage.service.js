// Author: Gururaj
// Created: 31th July 2025
// Description: Service to maintian to sms package of the organization (creds).
// Version: 1.0.0


const { SMSPackage, Organization } = require('../../models');
const { withContext } = require('../../util/helper');
const { queryWithLogAudit } = require('../auditLog.service');

const SMSPackageService = {
  async updateOrCreate({  data, req }) {
    const organization = await Organization.findOne({ where: { id: data.organization_id } });
    if (!organization) {
      return { success: false, status: 404, message: "Organization not found" };
    }

    let smsPackage = await SMSPackage.findOne({ where: { organization_id: data.organization_id } });

    if (!smsPackage) {
      if (!data.provider || !data.sms_key || !data.sms_sender_id) {
        return { success: false, status: 400, message: "Provider, SMS key, and SMS sender id are required" };
      }
      data.use_default_price = !data.price_per_sms;
      smsPackage = await queryWithLogAudit({
        action: 'create',
        req,
        updated_columns: Object.keys(data),
        queryCallBack: async (t) => {
          return await SMSPackage.create(data, { transaction: t, ...withContext(req) });
        },
      });
    } else {

      if (data.use_default_price === false && !emailPackage.price_per_sms) return { success: false, status: 400, message: "Price per SMS is required when not using using default and no value before. " };
      smsPackage = await queryWithLogAudit({
        action: 'update',
        req,
        updated_columns: Object.keys(data),
        queryCallBack: async (t) => {
          return await smsPackage.update(data, { transaction: t, ...withContext(req) });
        },
      });
    }

    return {
      success: true,
      status: 200,
      message: 'Email Package saved successfully',
      data: smsPackage,
    };
  },

  async getById({ organizationId }) {
    const organization = await Organization.findOne({ where: { id: organizationId } });
    if (!organization) {
    return { success: false, status: 404, message: "Organization not found" };
    }

    const smsPackage = await SMSPackage.findOne({ where: { organization_id: organizationId } });

    if (!smsPackage) {
      return { success: false, status: 404, message: 'Email Package not found' };
    }

    return {
      success: true,
      status: 200,
      data: smsPackage,
    };
  },
};

module.exports = SMSPackageService;
