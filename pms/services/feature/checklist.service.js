// Author: Gururaj
// Created: 14th oct 2025
// Description: Checklist related service 
// Version: 1.0.0
// Modified:

const { Sequelize } = require("sequelize");
const { giveValicationErrorFormal, auditLogUpdateHelperFunction, paginateHelperFunction, withContext } = require("../../util/helper");
const { queryWithLogAudit } = require("../auditLog.service");

class ChecklistService {
  /**
   * Create a new checklist item
   * @param {Object} data - Checklist data (feature_id, title, description)
   * @param {Object} options - Optional parameters (req for context)
   * @returns {Promise<Object>} - Created checklist item
   */
  async createChecklistItem(req, data) {
    const { Checklist, Feature, Task } = req.db;
    try {
      
      const feature = await Feature.findByPk(data.feature_id, {
        include: [
          {
            association: "projects", // this points to ProjectFeature
            attributes: ["id", "status"], // from the pivot table
            include: [
              {
                association: "project", // this points to Project
                where: { is_completed: false },
                attributes: ["id", "name", "code", "is_completed"],
                required: true,
              },
            ],
          },
        ],
      });

      if (!feature)
        return { success: false, status: 404, message: "Feature not found!.." };

      const featureProjects = feature.projects || [];

      const checklist = await queryWithLogAudit({
          action: "create",
          req,
          queryCallBack : async (t) => {
            const checklist = await Checklist.create(data, {...withContext(req), transaction: t,});
            const projectFeatureTaskData = featureProjects.map((pf) => ({
              project_feature_id: pf.id, // pivot table id
              project_id: pf.project.id,
              department_id: feature.department_id,
              title: checklist.title,
              description: checklist.description,
              checklist_id: checklist.id,
              status: "assign_pending",
              task_for: "checklist",
            }));

            const tasks = await Task.bulkCreate(
              projectFeatureTaskData, 
              { ...withContext(req), transaction: t }
            );
            return checklist;
          }
        }
      );

      return { success: true, status: 201, data: checklist};
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return {
          success: false,
          status: 422,
          message: "Validation Error",
          errors: giveValicationErrorFormal(err),
        };
      }
      throw err;
    }
  }

  /**
   * Fetch a checklist item by ID
   * @param {String} checklistId - Checklist UUID
   * @returns {Promise<Object|null>} - Found checklist or null
   */
  async getChecklist(req, checklistId) {
    const { Checklist } = req.db;
    const item = await Checklist.findByPk(checklistId);
    if (!item) {
      return {
        status: 404,
        message: "Checklist item not found",
        success: false,
      };
    }
    return { data: item, success: true, status: 200 };
  }

  /**
   * Update an existing checklist item
   * @param {String} checklistId - Checklist UUID
   * @param {Object} data - Checklist data to update
   * @param {Object} options - Optional parameters (req for context)
   * @returns {Promise<Object>} - Updated checklist item
   */
  async updateChecklist(req, checklistId, data) {
    const { Checklist } = req.db;
    try {
      const item = await Checklist.findByPk(checklistId);
      if (!item) {
        return {
          status: 404,
          message: "Checklist item not found",
          success: false,
        };
      }

      const result = await auditLogUpdateHelperFunction(
        {model: item, data, req}
      );

      return { status: 200, success: true, data: result };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return {
          success: false,
          status: 422,
          message: "Validation Error",
          errors: giveValicationErrorFormal(err),
        };
      }
      throw err;
    }
  }

  /**
   * Delete a checklist item
   * @param {String} checklistId - Checklist UUID
   * @param {Object} options - Optional parameters (req for context)
   * @returns {Promise<Object>}
   */
  async deleteChecklist(req, checklistId) {
    const { Checklist, Task } = req.db;
    const item = await Checklist.findByPk(checklistId, {include: [{association : "tasks"}]});
    if (!item) {
      return {
        status: 404,
        success: false,
        message: "Checklist item Not Found!",
      };
    }

    await queryWithLogAudit({
      action: "delete",
      req,
      queryCallBack : async (t) => {
        const checklistTasks = item.tasks;
        if (checklistTasks && checklistTasks.length > 0) {
          await Task.update(
            { deleted_at: new Date(), status: "checklist_removed" }, // your update fields
            {
              where: { checklist_id: checklistId },
              ...withContext(req),
              transaction: t,
            }
          );
        }
        return await item.destroy({
          ...withContext(req),
          transaction: t,
        });

      },
      
    });


    return {
      status: 200,
      success: true,
      message: "Checklist item deleted successfully",
    };
  }

  /**
   * Fetch all checklist items of a Feature
   * @param {Object} options - { feature_id, req }
   * @returns {Promise<Array>} - List of checklist items
   */
  async getAllChecklistsOfFeature(req, { feature_id, query = {} }) {
    const { Feature, Checklist } = req.db;
    try {
      const feature = await Feature.findByPk(feature_id, );

      if (!feature)
        return { success: false, status: 404, message: "Feature not found!.." };

      const checklists = await paginateHelperFunction({model:Checklist, query, whereFilters: {feature_id} });

      return { status: 200, data: checklists, success: true };
    } catch (error) {
      throw new Error(`Error fetching checklist items: ${error.message}`);
    }
  }
}

module.exports = new ChecklistService();
