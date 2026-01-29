// Author : Gururaj
// Created: 31th July 2025
// Description: service for domain of the organization.
// Version: 1.0.0
// Modified: 


const { Domain, Organization } = require('../../models');
const { withContext } = require('../../util/helper');
const { queryWithLogAudit } = require('../auditLog.service');

const DNSMappingService = {
  async updateOrCreate({ organizationId, data, req }) {
    const organization = await Organization.findOne({ where: { id: organizationId } });
    if (!organization) {
      return { success: false, status: 404, message: "Organization not found" };
    }

    let record = await Domain.findOne({ where: { organization_id: organizationId } });
    if (!record) {
      record = await queryWithLogAudit({
        action: 'create',
        req,
        updated_columns: Object.keys(data),
        queryCallBack: async (t) => {
          return await Domain.create(
            { organization_id: organizationId, ...data },
            { transaction: t, ...withContext(req) }
          );
        },
      });
    } else {
      record = await queryWithLogAudit({
        action: 'update',
        req,
        updated_columns: Object.keys(data),
        queryCallBack: async (t) => {
          return await record.update(data, { transaction: t, ...withContext(req) });
        },
      });
    }

    return { success: true, status: 200, message: "DNS Mapping updated successfully", data: record };
  },

  async getById({ organizationId }) {
    const record = await Domain.findOne({ where: { organization_id: organizationId } });
    if (!record) return { success: false, status: 404, message: "DNS mapping not found" };
    return { success: true, status: 200, data: record };
  },
};

module.exports = DNSMappingService;
