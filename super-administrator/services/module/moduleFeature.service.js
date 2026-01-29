// Author: Gururaj
// Created: 8th July 2025
// Description: Service for managing Module Features.
// Version: 1.0.0

const { ModuleFeature, ModuleVersion } = require('../../models');
const { withContext } = require('../../util/helper');
const paginate = require('../../util/pagination');
const { queryWithLogAudit } = require('../auditLog.service');

const ModuleFeatureService = {
  async create({ req, data }) {
    // Check if module exists
    const moduleVersion = await ModuleVersion.findByPk(data.module_version_id);
    
    if (!moduleVersion) {
        return { success: false, status: 400, message: "Module of this version does not exist" };
    }
    data.module_id = moduleVersion.module_id;
    try {
        // Attempt to create the feature
        const query = async (t) => {
          return await ModuleFeature.create(data, {...withContext(req), transaction: t,});
        }
        const feature = await queryWithLogAudit({ req, action : "create", queryCallBack : query,  updated_columns : Object.keys(data)});
        return { success: true, status: 201, data: feature };
    } catch (err) {
        // Handle unique constraint violation
        if (err.name === 'SequelizeUniqueConstraintError') {
            const isCodeConflict = err.errors.some(e => e.path === 'code' || e.path === 'module_id');
            if (isCodeConflict) return { success: false, status: 409, message: `Feature code '${data.code}' already exists in this module.` }
        }
        // Log and return generic error if not handled
        console.error("Error creating feature:", err);
        return { success: false, status: 500, message: "An unexpected error occurred while creating the feature." };
    }
  },


  async update({ id, data, req }) {
    const feature = await ModuleFeature.findByPk(id);
    if (!feature) return { success: false, status: 404, message: "Feature not found" };

    try {
        const query = async (t) => {
          return await feature.update(data, {...withContext(req), transaction: t,});
        }
        const updatedFeature = await queryWithLogAudit({ req, action : "update", queryCallBack : query,  updated_columns : Object.keys(data)});

        return { success: true, status: 200, message: "Updated successfully", data: updatedFeature };
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
        const isCodeConflict = err.errors.some(e => e.path === 'code' || e.path === 'module_id');
        if (isCodeConflict) return { success: false, status: 409, message: `Feature code '${data.code}' already exists in this module.`};
        }

        console.error("Error updating feature:", err);
        return { success: false, status: 500, message: "An unexpected error occurred while updating the feature." };
    }
  },

  async getById(id) {
    const feature = await ModuleFeature.findByPk(id);
    if (!feature) return { success: false, status: 404, message: "Feature not found" };
    return { success: true, status: 200, data: feature };
  },

  async getAll(module_version_id, query) {

    const module = await ModuleVersion.findByPk(module_version_id);
    if (!module) {
        return { success: false, status: 404, message: "Module not found for this version." };
    }
    
    const {
      page,
      perPage,
      sortField = 'created_at',
      sortOrder = 'desc',
      searchText = '',
      searchField = '',
      searchOperator = '',
    } = query;

    const result = await paginate(
      ({ offset, limit, sortField, sortOrder, where }) =>
        ModuleFeature.findAndCountAll({
          where: { ...where, module_version_id },
          offset,
          limit,
          order: [[sortField, sortOrder]],
        }),
      page,
      perPage,
      sortField,
      sortOrder,
      searchText,
      searchField,
      searchOperator,
      ModuleFeature
    );

    return { success: true, status: 200, data: result };
  },

  async delete({id, req}) {
    const feature = await ModuleFeature.findByPk(id);
    if (!feature) return { success: false, status: 404, message: "Feature not found" };
    const query = async (t) => {
      return await feature.destroy( {...withContext(req), transaction: t,});
    }
    await queryWithLogAudit({ req, action : "delete", queryCallBack : query});
    return { success: true, status: 200, message: "Deleted successfully" };
  }
};

module.exports = ModuleFeatureService;
