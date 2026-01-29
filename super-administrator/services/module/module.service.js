// Author: Gururaj
// Created: 7th July 2025
// Description: Service for managing Module Registry.
// Version: 1.0.0

const { UniqueConstraintError } = require('sequelize');
const { ModuleRegistry, ModuleVersion, ModuleMaxVersion } = require('../../models');
const { withContext } = require('../../util/helper');
const { queryWithLogAudit, queryMultipleWithAuditLog } = require("../../services/auditLog.service");
const paginate = require('../../util/pagination');

const ModuleRegistryService = {
  async create({ req, data }) {
    try {
      const moduleData = {code : data.code, name : data.name, description: data.description};
      const versionData = { description: data.version_discription, version : 1, docker_container : data.docker_container, port : data.port };

      let createdModule = null;
      const results = await queryMultipleWithAuditLog({
        req,
        operations: [
          {
            action: "create",
            queryCallBack: async (t) => {
              createdModule = await ModuleRegistry.create(moduleData, {
                ...withContext(req),
                transaction: t,
              });
              return createdModule;
            },
            updated_columns: Object.keys(moduleData),
            remarks: "Creating ModuleRegistry entry",
          },
          {
            action: "create",
            queryCallBack: async (t) => {
              versionData.module_id = createdModule?.id;
              return await ModuleVersion.create(versionData,
                {
                  ...withContext(req),
                  transaction: t,
                }
              );
            },
            updated_columns: Object.keys(versionData),
            remarks: "Creating ModuleVersion entry",
            auditTargetExtractor: (result) => result, // optional
          },
        ],
      });

      ModuleMaxVersion.create({module_id : createdModule.id });

      const moduleResult = results[0].get({ plain: true });
      moduleResult.version = results[1].get({ plain: true });

      return { success: true, status: 201, data: moduleResult };

    } catch (error) {
      console.log(error);
      if (error instanceof UniqueConstraintError) return { success: false, status: 400, message: `${error.errors[0].path} must be unique`,};
      
      // generic error fallback
      return { success: false, status: 500, message: 'Internal server error' };
    }
  },
  async createVersion({ req, data }) {
    try {
      
      const module = await ModuleRegistry.findByPk(data.id);
        if (!module)  return { success: false, status: 404, message: "Module not found" };
        
        // Get current max version
          const maxVersionEntry = await ModuleMaxVersion.findOne({ where: { module_id: data.id } });

          const newVersion = maxVersionEntry ? maxVersionEntry.max_version + 1 : 1;
          

        // Create new version entry
        const versionData = {
          docker_container: data.docker_container,
          description: data.description,
          version: newVersion,
          port : data.port
        };

        let createdVersion;

        await queryWithLogAudit({
          req,
          action: "create",
          updated_columns: ["docker_container", "description", "version", "port"],
          queryCallBack: async (t) =>
            createdVersion = await module.createVersion(versionData, { ...withContext(req), transaction: t }),
        });

        if (maxVersionEntry) {
          maxVersionEntry.update({ max_version: newVersion }, withContext(req));
        } else {
          ModuleMaxVersion.create({ module_id: data.id, max_version: newVersion }, withContext(req));
        }

        module.dataValues.version = createdVersion;

        return { success: true, status: 201, data: module };


    } catch (error) {
      console.log(error);
      if (error instanceof UniqueConstraintError) return { success: false, status: 400, message: `${error.errors[0].path} must be unique`,};
      
      // generic error fallback
      return { success: false, status: 500, message: 'Internal server error' };
    }
  },

  async update({ id, data, req }) {
    const module = await ModuleRegistry.findByPk(id);
    if (!module) return { success: false, status: 404, message: "Module not found" };
    if (data.docker_container && data.docker_container === module.docker_container) return { success: false, status: 400, message: `Container must be unique`,};

    const query = async (t) => {
      return await  module.update(data, {...withContext(req), transaction: t,});
    }
    const updatedModule = await queryWithLogAudit({ req, action : "update", queryCallBack : query,  updated_columns : Object.keys(data)});

    return { success: true, status: 200, message: "Updated successfully", data: updatedModule };
  },


  async updateVersion({ data, req }) {
    try {
      const module = await ModuleRegistry.findByPk(data.id, {
        include: [
          {
            model: ModuleVersion,
            as: 'versions', 
            where: {
              id: data.version_id
            },
            required: false 
          }
        ]
      });

      if (!module || !module.versions || module.versions.length === 0) {
        return { success: false, status: 404, message: "Module not found with that version." };
      }

      const versionToUpdate = module.versions[0];

      const changeData = {
        ...data,
        version: parseFloat(versionToUpdate.version) + 0.01
      };

      const query = async (t) => {
        return await versionToUpdate.update(changeData, {
          ...withContext(req),
          transaction: t,
        });
      };

      const updatedModule = await queryWithLogAudit({
        req,
        action: "update",
        queryCallBack: query,
        updated_columns: Object.keys(changeData)
      });

      return { success: true, status: 200, message: "Updated successfully", data: updatedModule };
    } catch (error) {
      console.log(error);
      if (error instanceof UniqueConstraintError) return { success: false, status: 400, message: `${error.errors[0].path} must be unique`,};
      
      // generic error fallback
      return { success: false, status: 500, message: 'Internal server error' };
    }
  },

  async getById(id) {
    const module = await ModuleRegistry.findByPk(
      id,
      { include: [{ model: ModuleVersion, as: 'versions' }] }
    );
    if (!module) return { success: false, status: 404, message: "Module not found" };
    return { success: true, status: 200, data: module };
  },

  async getAll(query) {
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
        ModuleRegistry.findAndCountAll({
          where,
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
      ModuleRegistry
    );

    return { success: true, status: 200, data: result };
  },

  async delete({id, req}) {
    const module = await ModuleRegistry.findByPk(id);
    if (!module) return { success: false, status: 404, message: "Module not found" };

    const query = async (t) => {
      return await  module.destroy( {...withContext(req), transaction: t,});
    }
    await queryWithLogAudit({ req, action : "delete", queryCallBack : query});

    return { success: true, status: 200, message: "Deleted successfully" };
  },

  // delete any verion of that
  async deleteVersion({id, req}) {
    const moduleVersion = await ModuleVersion.findByPk(id);
    if (!moduleVersion) return { success: false, status: 404, message: "Module version not found" };

    const query = async (t) => {
      return await  moduleVersion.destroy( {...withContext(req), transaction: t,});
    }
    await queryWithLogAudit({ req, action : "delete", queryCallBack : query});

    return { success: true, status: 200, message: "Deleted successfully" };
  }
};

module.exports = ModuleRegistryService ;
