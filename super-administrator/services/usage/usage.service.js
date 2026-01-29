// Author: Gururaj
// Created: 31th July 2025
// Description: Service to maintian resource usage of the organization.
// Version: 1.0.0

const { OrganizationUsageLimits, Organization } = require('../../models');
const { withContext } = require('../../util/helper');
const { queryWithLogAudit } = require('../auditLog.service');

const EmailPackageService = {
  // create or update the limits of the organization resource usage
  async updateLimit({  data, req }) {
    const organization = await Organization.findOne({ where: { id: data.organization_id } });
    if (!organization) {
      return { success: false, status: 404, message: "Organization not found" };
    }

    const usageLimits = await OrganizationUsageLimits.findOne({ where: { organization_id: data.organization_id } });

    if (!usageLimits) {
      if (!data.user_limit || !data.storage_limit_mb || !data.db_limit_mb || !data.sms_limit || !data.email_limit || !data.api_requests_limit) {
        return { success: false, status: 400, message: "All limits are required" };
      }
      data.from_data = new Date().toISOString().split('T')[0]; 
      const newUsageLimits = await queryWithLogAudit({
        action: 'create',
        req,
        updated_columns: Object.keys(data),
        queryCallBack: async (t) => {
          return await OrganizationUsageLimits.create(data, { transaction: t, ...withContext(req) });
        },
      });
      return { success: true, status: 200, message: 'Usage Limits created successfully', data: newUsageLimits,};
    } else {
      const updatedUsageLimits = await queryWithLogAudit({
        action: 'update',
        req,
        updated_columns: Object.keys(data),
        queryCallBack: async (t) => {
          return await usageLimits.update(data, { transaction: t, ...withContext(req) });
        },
      });
      return { success: true, status: 200, message: 'Usage Limits updated successfully', data: updatedUsageLimits, };
    }
  },

  // update the usage of the organization (only can be done if the limits is set )
  async updateUsage ({ data, req }) {
    const organization = await Organization.findOne({ where: { id: data.organization_id } });
    if (!organization) {
      return { success: false, status: 404, message: "Organization not found" };
    }

    const usage = await OrganizationUsageLimits.findOne({ where: { organization_id: data.organization_id } });
    if (!usage) {
      return { success: false, status: 404, message: "Limits for this organization not found, please create the limits" };
    }

    const updateData = {};

    if (data.user_count) updateData.user_count = usage.user_count + data.user_count;
    if (data.storage_usage_mb) updateData.storage_usage_mb = usage.storage_usage_mb + data.storage_usage_mb;
    if (data.db_usage_mb) updateData.db_usage_mb = usage.db_usage_mb + data.db_usage_mb;
    if (data.sms_usage) {updateData.sms_usage = usage.sms_usage + data.sms_usage; updateData.total_sms_usage = usage.total_sms_usage + data.sms_usage; }
    if (data.email_usage) {
      updateData.email_usage = usage.email_usage + data.email_usage;
      updateData.total_email_usage = usage.total_email_usage + data.email_usage;
    }
    if (data.api_requests) {
      updateData.api_requests = usage.api_requests + data.api_requests;
      updateData.total_api_requests = usage.total_api_requests + data.api_requests;
    }
    await queryWithLogAudit({
      action: 'update',
      req,
      updated_columns: Object.keys(updateData),
      queryCallBack: async (t) => {
        return await usage.update(updateData, { transaction: t, ...withContext(req) });
      },
    });
    return { success: true, status: 200, message: 'Usage History updated successfully', data: usage };
  },

  async getById({ organizationId }) {
    const organization = await Organization.findOne({ where: { id: organizationId } });
    if (!organization) {
    return { success: false, status: 404, message: "Organization not found" };
    }

    const usageLimits = await OrganizationUsageLimits.findOne({ where: { organization_id: organizationId } });

    if (!usageLimits) return { success: false, status: 404, message: 'Usage Limits not found' };

    return { success: true, status: 200, data: usageLimits,};
  },
};

module.exports = EmailPackageService;
