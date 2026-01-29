// Author: Gururaj
// Created: 31th July 2025
// Description: Service to maintian to email package of the organization (creds).
// Version: 1.0.0

const { EmailPackage, Organization } = require('../../models');
const { withContext } = require('../../util/helper');
const { queryWithLogAudit } = require('../auditLog.service');

const EmailPackageService = {
  async updateOrCreate({  data, req }) {
    const organization = await Organization.findOne({ where: { id: data.organization_id } });
    if (!organization) {
      return { success: false, status: 404, message: "Organization not found" };
    }

    let emailPackage = await EmailPackage.findOne({ where: { organization_id: data.organization_id } });

    if (!emailPackage) {
      if (!data.provider || !data.smtp_user || !data.smtp_host) {
        return { success: false, status: 400, message: "Provider, SMTP user, and SMTP host are required" };
      }
      data.use_default_price = !data.price_per_email;
      emailPackage = await queryWithLogAudit({
        action: 'create',
        req,
        updated_columns: Object.keys(data),
        queryCallBack: async (t) => {
          return await EmailPackage.create(data, { transaction: t, ...withContext(req) });
        },
      });
    } else {

      if (data.use_default_price === false && !emailPackage.price_per_email) return { success: false, status: 400, message: "Price per email is required when not using using default and no value before. " };
      emailPackage = await queryWithLogAudit({
        action: 'update',
        req,
        updated_columns: Object.keys(data),
        queryCallBack: async (t) => {
          return await emailPackage.update(data, { transaction: t, ...withContext(req) });
        },
      });
    }

    return {
      success: true,
      status: 200,
      message: 'Email Package saved successfully',
      data: emailPackage,
    };
  },

  async getById({ organizationId }) {
    const organization = await Organization.findOne({ where: { id: organizationId } });
    if (!organization) {
    return { success: false, status: 404, message: "Organization not found" };
    }

    const emailPackage = await EmailPackage.findOne({ where: { organization_id: organizationId } });

    if (!emailPackage) {
      return { success: false, status: 404, message: 'Email Package not found' };
    }

    return {
      success: true,
      status: 200,
      data: emailPackage,
    };
  },
};

module.exports = EmailPackageService;
