// Author: Gururaj
// Created: 14th Oct 2025
// Description: Feature service for v2 project-scoped feature CRUD with hierarchy validation and notification dispatch.
// Version: 2.0.0
// Modified:

// Description: Feature service - v2 restructured
// Features are now project-scoped independent entities
// Hierarchy: Feature → User Stories → Sub User Stories
// Version: 2.0.0

const {
  withContext,
  giveValicationErrorFormal,
  paginateHelperFunction,
  auditLogCreateHelperFunction,
  auditLogUpdateHelperFunction,
  auditLogDeleteHelperFunction,
} = require("../../util/helper");
const { createNotification } = require("../notification/notification.service");
const { queryMultipleWithAuditLog } = require("../auditLog.service");
const paginate = require("../../util/pagination");
const { Op, Sequelize } = require("sequelize");

class FeatureService {
  /**
   * Create a new feature
   * @param {Object} data - Feature data (project_id, department_id, name, description, status)
   * @param {Object} options - Optional parameters (req for context)
   * @returns {Promise<Object>} - Created feature
   */
  async createFeature(req, data) {
    const { Feature, Project } = req.db;
    try {
      // v2: project_id is REQUIRED for features
      if (!data.project_id) {
        return {
          success: false,
          status: 400,
          message: "project_id is required.",
        };
      }

      // Validate project exists
      const project = await Project.findByPk(data.project_id);
      if (!project) {
        return { success: false, status: 404, message: "Project not found" };
      }

      // Validate parent feature if provided
      if (data.parent_feature_id) {
        const parent = await Feature.findByPk(data.parent_feature_id);
        if (!parent) {
          return {
            success: false,
            status: 404,
            message: "Parent Feature not found",
          };
        }
        if (parent.project_id !== data.project_id) {
          return {
            success: false,
            status: 400,
            message: "Parent feature must be in the same project",
          };
        }
        if (parent.department_id !== data.department_id) {
          return {
            success: false,
            status: 400,
            message: "Parent feature must be in the same department",
          };
        }
      }

      const feature = await auditLogCreateHelperFunction({
        model: Feature,
        data,
        req,
      });
      return { success: true, status: 201, data: feature };
    } catch (err) {
      if (
        err instanceof Sequelize.ValidationError ||
        err instanceof Sequelize.UniqueConstraintError
      ) {
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
    const { Feature, UserStory } = req.db;
    const feature = await Feature.findByPk(featureId, {
      include: [
        {
          association: "userStories",
          where: { parent_user_story_id: null },
          required: false,
          include: [{ association: "subStories" }],
        },
        {
          association: "subFeatures",
          required: false,
        },
        {
          association: "parentFeature",
          required: false,
          attributes: ["id", "name"],
        },
      ],
    });
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

      const updatedData = await auditLogUpdateHelperFunction({
        model: feature,
        data,
        req,
      });
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

    await auditLogDeleteHelperFunction({ model: feature, req });

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
  async getAllFeaturesOfDepartment(
    req,
    { department_id, query = {}, project_id = null },
  ) {
    const { Feature, UserStory } = req.db;
    try {
      const whereFilters = { department_id };

      if (project_id) {
        whereFilters.project_id = project_id;
      }

      const extrasInQuery = {
        subQuery: false,
        include: [
          {
            model: UserStory,
            as: "userStories",
            attributes: [],
            required: false,
          },
        ],
        attributes: {
          include: [
            [
              Sequelize.fn(
                "COUNT",
                Sequelize.fn("DISTINCT", Sequelize.col("userStories.id")),
              ),
              "user_stories_count",
            ],
          ],
        },
        group: ["Feature.id"],
      };

      const result = await paginateHelperFunction({
        model: Feature,
        whereFilters,
        query,
        extrasInQuery,
      });

      if (Array.isArray(result.pagination.totalItems)) {
        result.pagination.totalItems = result.pagination.totalItems.length;
      }

      return { status: 200, data: result, success: true };
    } catch (error) {
      throw new Error(`Error fetching all features: ${error.message}`);
    }
  }
  /**
   * Get all features directly belonging to a project (v2)
   */
  async getAllFeaturesByProject(req, { project_id, query = {} }) {
    const { Feature, Project, UserStory } = req.db;
    try {
      const project = await Project.findByPk(project_id);
      if (!project)
        return { status: 404, message: "Project not found!", success: false };

      const whereFilters = { project_id };

      const extrasInQuery = {
        subQuery: false,
        include: [
          {
            model: UserStory,
            as: "userStories",
            attributes: [],
            required: false,
          },
        ],
        attributes: {
          include: [
            [
              Sequelize.fn(
                "COUNT",
                Sequelize.fn("DISTINCT", Sequelize.col("userStories.id")),
              ),
              "user_stories_count",
            ],
            [
              Sequelize.literal(`(
                SELECT COUNT(*) FROM ${UserStory.getTableName()}
                WHERE feature_id = "Feature"."id" AND status = 'completed' AND deleted_at IS NULL
              )`),
              "completed_stories_count",
            ],
            [
              Sequelize.literal(`(
                SELECT COALESCE(SUM(story_points), 0) FROM ${UserStory.getTableName()}
                WHERE feature_id = "Feature"."id" AND deleted_at IS NULL
              )`),
              "total_points",
            ],
            [
              Sequelize.literal(`(
                SELECT COALESCE(SUM(story_points), 0) FROM ${UserStory.getTableName()}
                WHERE feature_id = "Feature"."id" AND status = 'completed' AND deleted_at IS NULL
              )`),
              "completed_points",
            ],
          ],
        },
        group: ["Feature.id"],
      };

      const result = await paginateHelperFunction({
        model: Feature,
        whereFilters,
        query,
        extrasInQuery,
      });

      if (Array.isArray(result.pagination.totalItems)) {
        result.pagination.totalItems = result.pagination.totalItems.length;
      }

      return { status: 200, data: result, success: true };
    } catch (error) {
      console.log(error);
      throw new Error(`Error fetching project features: ${error.message}`);
    }
  }
  async getAllFeaturesOfProject(req, { project_id, query = {} }) {
    const { Feature, Project, ProjectFeature } = req.db;
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

      if (!project)
        return { status: 404, message: "Project not found!.", success: false };

      const result = await paginate(
        ({ offset, limit, sortField, sortOrder, where }) =>
          Feature.findAndCountAll({
            include: [
              {
                model: ProjectFeature,
                as: "projectFeatures",
                required: true,
                where: { project_id },
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
        Feature,
      );
      return { status: 200, data: result, success: true };
    } catch (error) {
      console.log(error);
      throw new Error(`Error fetching all project features: ${error.message}`);
    }
  }

  async addFeatureToProject(req, data) {
    const { Project, Feature, ProjectFeature } = req.db;

    const { projectId, featureId } = data;

    const [project, feature] = await Promise.all([
      Project.findByPk(projectId),
      Feature.findByPk(featureId),
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
      return {
        success: false,
        status: 409,
        message: "Feature already added to project ",
      };
    }

    const multiOperations = [];
    let mapping;

    multiOperations.push({
      queryCallBack: async (t) => {
        mapping = await ProjectFeature.create(
          {
            project_id: projectId,
            feature_id: featureId,
          },
          { ...withContext(req), transaction: t },
        );
        return mapping;
      },
      updated_columns: ["project_id", "feature_id"],
      action: "create",
      model: ProjectFeature,
    });

    multiOperations.push({
      queryCallBack: async (t) => {
        const notificationData = {
          scope: "project_department",
          title: `New feature added to ${project.name}`,
          message: `${feature.name} feature has been added to ${project.name}.`,
          triggeredById: req?.user?.id,
          projectId: project.id,
          departmentId: feature.department_id,
        };

        await createNotification(req, notificationData);
      },
      updated_columns: [],
      action: "notification",
      remarks: "Notification for feature added to project",
      model: ProjectFeature,
    });

    await queryMultipleWithAuditLog({ operations: multiOperations, req });

    return {
      success: true,
      status: 201,
      message: "Feature added to project successfully",
      data: mapping,
    };
  }
}

module.exports = new FeatureService();
