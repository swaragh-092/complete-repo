// Author: Gururaj
// Created: 14th oct 2025
// Description: Feature related service.
// Version: 1.0.0
// Modified:

const { withContext, giveValicationErrorFormal, paginateHelperFunction, auditLogCreateHelperFunction, auditLogUpdateHelperFunction, auditLogDeleteHelperFunction } = require("../../util/helper");
const { queryMultipleWithAuditLog } = require("../auditLog.service");
const { createNotification } = require("../notification/notification.service");
const paginate = require("../../util/pagination");
const { Op } = require("sequelize");

class FeatureService {
  /**
   * Create a new feature
   * @param {Object} data - Feature data (department_id, name, description, status)
   * @param {Object} options - Optional parameters (req for context)
   * @returns {Promise<Object>} - Created feature
   */
  async createFeature(req, data) {
    const { Feature } = req.db;
    try {
      const feature = await auditLogCreateHelperFunction({model: Feature, data, req});
      return { success: true, status: 201, data: feature };
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
   * Fetch a feature by ID
   * @param {String} featureId - Feature UUID
   * @returns {Promise<Object|null>} - Found feature or null
   */
  async getFeature(req, featureId) {
    const { Feature } = req.db;
    const feature = await Feature.findByPk(featureId);
    if (!feature) {
      return { status: 404, message: "Feature not found", success: false };
    }
    return { data: feature, success: true, status: 200 };
  }

  /**
   * Update an existing feature
   * @param {String} featureId - Feature UUID
   * @param {Object} data - Feature data to update
   * @param {Object} options - Optional parameters (req for context)
   * @returns {Promise<Object>} - Updated feature
   */
  async updateFeature(req, featureId, data) {
    const { Feature } = req.db;
    try {
      const feature = await Feature.findByPk(featureId);
      if (!feature) {
        return { status: 404, message: "Feature not found", success: false };
      }

      const updatedData = await auditLogUpdateHelperFunction({model: feature, data, req});
      return { status: 200, success: true, data: updatedData };
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
   * Delete a feature
   * @param {String} featureId - Feature UUID
   * @param {Object} options - Optional parameters (req for context)
   * @returns {Promise<Object>}
   */
  async deleteFeature(req, featureId) {
    const { Feature } = req.db;
    const feature = await Feature.findByPk(featureId);
    if (!feature) {
      return { status: 404, success: false, message: "Feature Not Found!" };
    }


    await auditLogDeleteHelperFunction({model: feature, req});

    return {
      status: 200,
      success: true,
      message: "Feature deleted successfully",
    };
  }

  /**
   * Fetch all features
   * @param {Object} options - Optional parameters (req for context)
   * @returns {Promise<Array>} - List of features
   */
  async getAllFeaturesOfDepartment(req, {department_id, query= {}, project_id = null } ) {
    const { Feature } = req.db;
    try {

      const whereFilters = { department_id };

      if (project_id) {
        // Exclude features already linked to this project
        whereFilters.id = {
          [Op.notIn]: Sequelize.literal(`(
            SELECT feature_id FROM ${ProjectFeature.getTableName()} WHERE project_id = '${project_id}'
          )`),
        };
      }

      const extrasInQuery = {
        subQuery: false, 
        include: [
          {
            association: "checklists",
            attributes: [],
            required: false,
          },
        ],
        attributes: {
          include: [
            [Sequelize.fn("COUNT", Sequelize.col("checklists.id")), "checklists_count"],
          ],
        },
        group: ["Feature.id"],
      };
      
      const result = await paginateHelperFunction({model : Feature, whereFilters, query, extrasInQuery });

      if (Array.isArray(result.pagination.totalItems)) {
        result.pagination.totalItems = result.pagination.totalItems.length;
      }

      return { status: 200, data: result, success: true };
    } catch (error) {
      throw new Error(`Error fetching all features: ${error.message}`);
    }
  }

  async getAllFeaturesOfProject(req, {project_id, query= {} } ) {

    const { Feature, Project } = req.db;
    try {
      const {
        page,
        perPage,
        sortField = "created_at",
        sortOrder = "desc",
        searchText = "",
        searchField = "",
        searchOperator = "",
      } = query;

      const project = await Project.findByPk(project_id);

      if (!project) return {status: 404, message : "Project not found!.", success : false};

      const result = await paginate(
        ({ offset, limit, sortField, sortOrder, where }) =>
          Feature.findAndCountAll({
            include: [
              {
                model: ProjectFeature,
                as: "projects",
                required: true,
                where : {project_id}
                
              },
            ],
            where,
            offset,
            limit,
            order: [[sortField, sortOrder]],
            distinct: true,
          }),
        page,
        perPage,
        sortField,
        sortOrder,
        searchText,
        searchField,
        searchOperator,
        Feature
      );
      return { status: 200, data: result, success: true };
    } catch (error) {
      console.log(error);
      throw new Error(`Error fetching all project features: ${error.message}`);
    }
  }


  async addFeatureToProject(req, data) {
    const { Project, Feature, ProjectFeature, Task } = req.db;

    const { projectId, featureId } = data;

    const [project, feature] = await Promise.all([
      Project.findByPk(projectId),
      Feature.findByPk(featureId, {include : [ {association : "checklists"} ]}),
    ]);

    if (!project) {
      return { success: false, status: 404, message: "Project not found" };
    }

    if (!feature) {
      return { success: false, status: 404, message: "Feature not found" };
    }

    const existingRelation = await ProjectFeature.findOne({
      where: { project_id: projectId, feature_id: featureId },
    });

    if (existingRelation) {
      return { success: false, status: 409, message: "Feature already added to project " };
    }

    const multiOperations = [];
    let mapping;

    multiOperations.push({
      queryCallBack: async (t) => {
        mapping =  await ProjectFeature.create({
          project_id: projectId,
          feature_id: featureId,
        }, {...withContext(req), transaction: t});
        return mapping;
      },
      updated_columns: ['project_id', "feature_id"],
      action: "create",
      model: ProjectFeature,
    });
    
    
    multiOperations.push({
      queryCallBack: async (t) => {
        const projectFeatureTaskData = feature.checklists.map((checklist) => ({
          project_feature_id: mapping.id,
          project_id: projectId,
          department_id: feature.department_id,
          title: checklist.title,
          description: checklist.description,
          checklist_id: checklist.id,
          status: "assign_pending",
          task_for : "checklist"
        }));

        const tasks = await Task.bulkCreate(
          projectFeatureTaskData, 
          { ...withContext(req), transaction: t }
        );

        const notificationData = {
          scope : "project_department", 
          title: `new feature added to ${project.name}`,
          message : `${feature.name} feature is added to the ${project.name} and for this feature related checklist new task has been created.`,
          triggeredById : req?.user?.id,
          projectId : project.id,
          departmentId: feature.department_id
        };

        await createNotification(req, notificationData);

        return tasks;
      },
      updated_columns: ["project_feature_id", "project_id", "department_id", "title", "description", "checklist_id", "status"],
      action: "bulk_create",
      remarks: "Creating task for features",
      model: Task,
    });


    await queryMultipleWithAuditLog({operations: multiOperations, req});
    

    return {
      success: true,
      status: 201,
      message: "Feature added to project successfully",
      data: mapping,
    };
  }
}

module.exports = new FeatureService();
