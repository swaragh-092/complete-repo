// Author : Gururaj
// Created: 31th July 2025
// Description: service for database of the organization.
// Version: 1.0.0
// Modified: 

const { Database, Organization, ModuleRegistry, ModuleVersion } = require('../../models');
const { withContext } = require('../../util/helper');
const { Sequelize } = require('sequelize');
const { queryWithLogAudit } = require('../auditLog.service');

module.exports = {
  // 
  async createOrUpdate({ data, req }) {
    const { organization_id, module_version_id } = data;
    try {
    let record = await Database.findOne({ where: { organization_id, module_version_id } });
    if (record) {
      data.schema_version = String(parseInt(record.schema_version || 0, 10) + 1);

      await queryWithLogAudit({
        action: 'update',
        req,
        updated_columns: Object.keys(data),
        queryCallBack: async (t) => {
          return await record.update(data, { transaction: t, ...withContext(req) });
        },
      });

    } else {
      data.schema_version = '1';

      record = await queryWithLogAudit({
        action: 'create',
        req,
        updated_columns: Object.keys(data),
        queryCallBack: async (t) => {
          return await Database.create(data, { transaction: t, ...withContext(req) });
        },
      });
    }

    return { success: true, status: 200, data: record };
    } catch (err) {
      // Handle FK constraint error
      if (err instanceof Sequelize.ForeignKeyConstraintError) return { success: false, status: 400, message: 'Invalid organization_id or module_id.',};

      // Unknown error fallback
      console.error('Unexpected error in database createOrUpdate:', err);
      return  {success: false,  status: 500, message: 'Internal server error while creating/updating database',};
    }
  },

  async get({ organization_id, module_version_id }) {
    const [organization, module] = await Promise.all([
      Organization.findOne({ where: { id: organization_id } }),
      ModuleVersion.findOne({ where: { id: module_version_id } })
    ]);
    if (!organization) {
      return { success: false, status: 404, message: 'Organization not found' };
    }
    if (!module) {
      return { success: false, status: 404, message: 'Module of that version not found' };
    }

    const record = await Database.findOne({ where: { organization_id, module_version_id } });

    if (!record) {
      return { success: false, status: 404, message: 'Database record not found' };
    }

    return { success: true, status: 200, data: record };
  },

  async getAll({ organization_id }) {
    const organization = await Organization.findOne({ where: { id: organization_id } });
    if (!organization) {
      return { success: false, status: 404, message: 'Organization not found' };
    }

    const records = await Database.findAll({ where: { organization_id } });

    if (records.length === 0) {
      return { success: false, status: 404, message: 'No database records found' };
    }

    return { success: true, status: 200, data: records };
  }
};
