/*
Author: Homshree
Created: 13th June 2025
Description: Service layer for project-related business logic.
Version: 1.0.0
Modified: Gururaj, modifired completey based on new req, 14th oct 2025
*/

const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const { namespace } = require("../../config/cls");
const {  giveValicationErrorFormal, paginateHelperFunction, auditLogCreateHelperFunction, auditLogUpdateHelperFunction, auditLogDeleteHelperFunction } = require("../../util/helper");
const { getProjectDeliverySnapshot, getProjectHealthOverview } = require("../analytics.repository");

class ProjectService {
  /**
   * Create a new project
   * @param {Object} data - Project data (name, description, startDate, endDate, organization_id)
   * @param {Object} options - Optional parameters (user, req for context)
   * @returns {Promise<Object>} - Created project
   */
  async createProject(req, data) {
    
    const { Project } = req.db;

    // Create project with context
    try {
      const project = await auditLogCreateHelperFunction({model: Project, data, req});
      return { success: true, status: 201, data: project };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return {
          success: false,
          status: 422,
          message: `Validation Error`,
          errors: giveValicationErrorFormal(err),
        };
      }
      throw err;
    }
  }

  /**
   * Fetch a project by ID or name
   * @param {String} projectId - Project UUID
   * @returns {Promise<Object|null>} - Found project or null
   */
  async getProject(req, projectId, {include_features} = {}) {
    const { Project } = req.db;

    const project = await Project.findByPk(projectId, {
      include: include_features ? [{ association: "features", include: [{association: "feature"}] }] : [],
    });
    
    if (!project)
      return { status: 404, message: "project not found", success: false };

    return { data: project, success: true, status: 200 };
  }

  /**
   * Update an existing project
   * @param {String} projectId - Project UUID
   * @param {Object} data - Project data to update (name, description, startDate, endDate, organization_id)
   * @param {Object} options - Optional parameters ( req for context)
   * @returns {Promise<Object>} - Updated project
   */
  async updateProject(req, projectId, data) {
    const { Project } = req.db;

    try {
      const project = await Project.findByPk(projectId);
      if (!project)
        return { status: 404, message: "Project not found", success: false };

      // Update project with context
      await auditLogUpdateHelperFunction({model: project, data, req});

      return { status: 200, success: true, data: project };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return {
          success: false,
          status: 422,
          message: `Validation Error`,
          errors: giveValicationErrorFormal(err),
        };
      }
      throw err;
    }
  }

  /**
   * Delete a project
   * @param {String} projectId - Project UUID
   * @param {Object} options - Optional parameters (user, req for context)
   * @returns {Promise<void>}
   */
  async deleteProject(req, projectId) {
    const { Project } = req.db;
    const project = await Project.findByPk(projectId);
    if (!project) {
      return { status: 404, success: false, message: "Project Not Found!" };
    }

    await auditLogDeleteHelperFunction({model: project, req});

    return {
      status: 200,
      success: true,
      message: "project deleted successfully",
    };
  }

  /**
   * Fetch all projects
   * @param {Object} options - Optional parameters (user, req for context)
   * @returns {Promise<Array>} - List of projects
   */
  async getAllProjects({ req, query, extrafilter } = {}) {

    const { Project, Issue, Task } = req.db;
    try {

      let whereFilters = {};
      const extrasInQuery = {
        as : "project"
      };

      if (extrafilter) {
        if (extrafilter === 'ongoing') {
          whereFilters.is_completed = false;
        }else if (extrafilter === 'on_track') {

          whereFilters.is_completed = false;

          whereFilters = {
            ...whereFilters,
            [Op.and]: [
              Sequelize.literal(`
                NOT EXISTS (
                  SELECT 1
                  FROM ${Issue.getTableName()} i
                  WHERE i.project_id = "Project"."id"
                    AND i.deleted_at IS NULL
                    AND i.priority IN ('high','critical')
                    AND i.status IN ('open','re_open','in_progress','resolved')
                )
              `),
              Sequelize.literal(`
                NOT EXISTS (
                  SELECT 1
                  FROM ${Task.getTableName()} t
                  WHERE t.project_id = "Project"."id"
                    AND t.deleted_at IS NULL
                    AND t.status NOT IN ('blocked','completed','reject')
                    AND t.due_date < NOW()
                )
              `)
            ]
          };

          // IMPORTANT for findAndCountAll
          extrasInQuery.subQuery = false;
          extrasInQuery.distinct = true;
          extrasInQuery.col = '"Project"."id"';
        } else if (extrafilter === 'at_risk') {
          whereFilters.is_completed = false;

          whereFilters = {
            ...whereFilters,
            [Op.and]: [

              // At least ONE risky issue OR task
              Sequelize.literal(`
                (
                  (
                    SELECT COUNT(1)
                    FROM ${Issue.getTableName()} i
                    WHERE i.project_id = "Project"."id"
                      AND i.deleted_at IS NULL
                      AND i.priority IN ('high','critical')
                      AND i.status IN ('open','re_open','in_progress','resolved')
                  ) BETWEEN 1 AND 5

                  OR

                  (
                    SELECT COUNT(1)
                    FROM ${Task.getTableName()} t
                    WHERE t.project_id = "Project"."id"
                      AND t.deleted_at IS NULL
                      AND t.status NOT IN ('blocked','completed','reject')
                      AND t.due_date < NOW()
                  ) BETWEEN 1 AND 5
                )
              `),

              // BUT NOT critical overflow
              Sequelize.literal(`
                (
                  (
                    SELECT COUNT(1)
                    FROM ${Issue.getTableName()} i
                    WHERE i.project_id = "Project"."id"
                      AND i.deleted_at IS NULL
                      AND i.priority IN ('high','critical')
                      AND i.status IN ('open','re_open','in_progress','resolved')
                  ) < 6

                  AND

                  (
                    SELECT COUNT(1)
                    FROM ${Task.getTableName()} t
                    WHERE t.project_id = "Project"."id"
                      AND t.deleted_at IS NULL
                      AND t.status NOT IN ('blocked','completed','reject')
                      AND t.due_date < NOW()
                  ) < 6
                )
              `)
            ]
          };

          extrasInQuery.subQuery = false;
          extrasInQuery.distinct = true;
          extrasInQuery.col = '"Project"."id"';
        } else if (extrafilter === 'critical') {
          whereFilters.is_completed = false;
          whereFilters = {
            ...whereFilters,
            [Op.or]: [
              Sequelize.literal(`
                (
                  SELECT COUNT(1)
                  FROM ${Issue.getTableName()} i
                  WHERE i.project_id = "Project"."id"
                    AND i.deleted_at IS NULL
                    AND i.priority IN ('high','critical')
                    AND i.status IN ('open','re_open','in_progress','resolved')
                ) >= 6
              `),
              Sequelize.literal(`
                (
                  SELECT COUNT(1)
                  FROM ${Task.getTableName()} t
                  WHERE t.project_id = "Project"."id"
                    AND t.deleted_at IS NULL
                    AND t.status NOT IN ('blocked','completed','reject')
                    AND t.due_date < NOW()
                ) >= 6
              `)
            ]
          };
          extrasInQuery.subQuery = false;
          extrasInQuery.distinct = true;
          extrasInQuery.col = '"Project"."id"';
        } else if (extrafilter === 'near_deadline') {
          whereFilters.is_completed = false;
          const next14Days = new Date();
          next14Days.setDate(next14Days.getDate() + 14);

          
          whereFilters.end_date = {
            [Sequelize.Op.between]: [new Date(), next14Days],
          };
        } else if (extrafilter === 'no_update') {
          whereFilters.is_completed = false;
          const fiveDaysAgo = new Date();
          fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

          whereFilters = {
            ...whereFilters,
            [Op.and]: [
              Sequelize.literal(`
                (
                  SELECT COUNT(1)
                  FROM ${Task.getTableName()} t
                  WHERE t.project_id = "Project"."id"
                    AND t.deleted_at IS NULL
                    AND t.updated_at > '${fiveDaysAgo.toISOString()}'
                ) = 0
              `)
            ]
          };
          extrasInQuery.subQuery = false;
          extrasInQuery.distinct = true;
          extrasInQuery.col = '"Project"."id"';
        } else if (extrafilter === 'overdue') { 
          whereFilters.is_completed = false;
          whereFilters.estimated_end_date = {
            [Sequelize.Op.lt]: Sequelize.fn('NOW'),
          };
        }
      }

      const result = await paginateHelperFunction({model : Project, query, whereFilters, extrasInQuery});
      
      return { status: 200, data: result, success: true };
    } catch (error) {
      console.log(error);
      throw new Error(`Error fetching all projects: ${error.message}`);
    }
  } 

  async getAllUserOngoingProjects(req, {departmentId } = {}) {
    const { Project } = req.db;
    try {
      
      const memberFilter = { user_id: req.user.id };

      if (departmentId) {
        memberFilter.department_id = departmentId;
      }
      const projects = await Project.findAll({
        where : {is_completed : false}, 
        include : [{association : "members", required : true, attributes: ["id", "user_id"], where : memberFilter}],
        attributes: ["id", "name", "is_completed"],
      });
      
      return { status: 200, data: projects, success: true };
    } catch (error) {
      throw new Error(`Error fetching all projects: ${error.message}`);
    }
  } 
  async getOverviewData(req) {
    const { Project } = req.db;
    try {
      const organization_id = namespace.get("organization_id");

      const ongoingProjects = await Project.count({ where: { is_completed: false } });
      const completedProjects = await Project.count({ where: { is_completed: true } });

      const totalProjects = ongoingProjects + completedProjects;
      
      const healthoverview = await getProjectHealthOverview(req, { organization_id });
      const deliverySnapshot = await getProjectDeliverySnapshot(req,{ organization_id });

      const responseData = {
        totalProjects,
        ongoingProjects,
        completedProjects,
        healthoverview,
        deliverySnapshot,
      };

      return { status: 200, data: responseData, success: true };
    } catch (error) {
      console.log(error);
      throw new Error(`Error fetching all projects: ${error.message}`);
    }
  } 
}

module.exports = new ProjectService();
