// Author: Gururaj
// Created:31th July 2025
// Description: Organization location service.
// Version: 1.0.0

const { OrganizationLocation, Organization } = require('../../models');
const { withContext } = require('../../util/helper');
const { queryWithLogAudit } = require('../auditLog.service');

const OrganizationLocationService = {
  async updateOrCreate({ organizationId, data, req }) {
    const organization = await Organization.findOne({ where: { id: organizationId } });
    if (!organization) {
      return { success: false, status: 404, message: "Organization not found" };
    }
    let location = await OrganizationLocation.findOne({ where: {organization_id: organizationId } });
    if (!location) {
        const query = async (t) => {
          return await OrganizationLocation.create({organization_id: organizationId, ...data},{...withContext(req), transaction: t,});
        }
        location = await queryWithLogAudit({ req, action : "create",queryCallBack : query, updated_columns : Object.keys(data)});
    } else {
        const query = async (t) => {
          return await location.update(data, {...withContext(req), transaction: t,});
        }
        location = await queryWithLogAudit({ req, action : "update",queryCallBack : query});
    }

    return { success: true, status: 200, message: "Updated successfully", data: location };
  },

  async getById({ organizationId }) {
    const organization = await Organization.findOne({ where: { id: organizationId } });
    if (!organization) {
      return { success: false, status: 404, message: "Organization not found" };
    }
    const location = await OrganizationLocation.findOne({ where: { organization_id: organizationId } });
    if (!location) return { success: false, status: 404, message: "Location not found" };
    return { success: true, status: 200, data: location };
  },
};

module.exports = OrganizationLocationService;
