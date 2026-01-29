// Author: Gururaj
// Created: 4th July 2025
// Description: Organization Admin Service
// Version: 1.0.0

const { OrganizationAdmin, Organization } = require('../../models');
const { withContext } = require('../../util/helper');
const paginate = require('../../util/pagination');
const { queryWithLogAudit } = require('../auditLog.service');

const OrganizationAdminService = {
  async create({ req, data }) {
    try {
        const org = await Organization.findByPk(data.organization_id);
        if (!org) return { success: false, status: 400, message: "Organization does not exist" };

        const query = async (t) => {
          return await OrganizationAdmin.create(data,{...withContext(req), transaction: t,});
        }
        const admin = await queryWithLogAudit({ req, action : "create",queryCallBack : query, updated_columns : Object.keys(data)});

        return { success: true, status: 201, data: admin };
    } catch (err){
        // Handle unique constraint violation
        if (err.name === 'SequelizeUniqueConstraintError') {
            const isCodeConflict = err.errors.some(e => e.path === 'keycloak_user_id');
            if (isCodeConflict) return { success: false, status: 409, message: `'${data.keycloak_user_id}' already exists.` }
        }
        // Log and return generic error if not handled
        console.error("Error creating feature:", err);
        return { success: false, status: 500, message: "An unexpected error occurred while creating the feature." };
    }
  },

  async update({ id, data, req }) {
    const admin = await OrganizationAdmin.findByPk(id);
    if (!admin) return { success: false, status: 404, message: "Admin not found" };
    try {
        const query = async (t) => {
          return await admin.update(data,{...withContext(req), transaction: t,});
        }
        const updatedAdmin = await queryWithLogAudit({ req, action : "update",queryCallBack : query, updated_columns : Object.keys(data)});

        return { success: true, status: 200, message: "Updated successfully", data: updatedAdmin };
    } catch (err){
        // Handle unique constraint violation
        if (err.name === 'SequelizeUniqueConstraintError') {
            const isCodeConflict = err.errors.some(e => e.path === 'keycloak_user_id');
            if (isCodeConflict) return { success: false, status: 409, message: `Feature code '${data.code}' already exists in this module.` }
        }
        // Log and return generic error if not handled
        console.error("Error creating feature:", err);
        return { success: false, status: 500, message: "An unexpected error occurred while creating the feature." };
    }
  },

  async getById(id) {
    const admin = await OrganizationAdmin.findByPk(id);
    if (!admin) return { success: false, status: 404, message: "Admin not found" };
    return { success: true, status: 200, data: admin };
  },

  async getAll(organization_id, query) {

    const organization = await Organization.findByPk(organization_id);
    if (!organization) {
        return { success: false, status: 404, message: "Organization not found" };
    }

    const {
      page, perPage,
      sortField = 'created_at',
      sortOrder = 'desc',
      searchText = '',
      searchField = '',
      searchOperator = ''
    } = query;

    const result = await paginate(
      ({ offset, limit, sortField, sortOrder, where }) =>
        OrganizationAdmin.findAndCountAll({
          where :{...where, organization_id},
          offset,
          limit,
          order: [[sortField, sortOrder]],
        }),
      page, perPage, sortField, sortOrder, searchText, searchField, searchOperator, OrganizationAdmin
    );

    return { success: true, status: 200, data: result };
  },

  async delete({id, req}) {
    const admin = await OrganizationAdmin.findByPk(id);
    if (!admin) return { success: false, status: 404, message: "Admin not found" };
    await admin.destroy(withContext(req));

    const query = async (t) => {
      return await admin.destroy({...withContext(req), transaction: t,});
    }
    await queryWithLogAudit({ req, action : "delete",queryCallBack : query});

    return { success: true, status: 200, message: "Deleted successfully" };
  }
};

module.exports = OrganizationAdminService;

