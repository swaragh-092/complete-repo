// Author: Gururaj
// Created: 31th July 2025
// Description: plan service.
// Version: 1.0.0

const { Plan, PlanSnapshot, ModuleFeatureSnapshot, SnapshotModule, SnapshotModuleFeature, PlanProject, PlanProjectSnapshot } = require("../../models");
const { withContext, success } = require("../../util/helper");
const paginate = require("../../util/pagination");
const { queryWithLogAudit, queryMultipleWithAuditLog } =require("../../services/auditLog.service");
const { Op } = require("sequelize");

module.exports = {
  async create({ data, req }) {    
    // create plan first 
    const query = async (t) => {
      return await Plan.create(data, {...withContext(req), transaction: t,});
    }
    const plan = await queryWithLogAudit({ req, action: "create", queryCallBack: query, updated_columns: Object.keys(data)});

    return { success: true, status: 201, data: plan };
  },
 
  async update({ id, data, req }) {
    const plan = await Plan.findByPk(id);
    if (!plan) return { success: false, status: 404, message: "Plan not found" };
    const query = async (t) => {
      return await plan.update(data, {...withContext(req), transaction: t,});
    }
    const updatedPlan = await queryWithLogAudit({ req, action : "update", queryCallBack : query, updated_columns : Object.keys(data)});
    return { success: true, status: 200, message: "Updated successfully", data: updatedPlan };
  },

  async delete({ id, req }) {
    const plan = await Plan.findByPk(id);
    if (!plan) return { success: false, status: 404, message: "Plan not found" };

    const query = async (t) => {
      return await plan.destroy( {...withContext(req), transaction: t,});
    }
    await queryWithLogAudit({ req, action : "delete", queryCallBack : query});
    return { success: true, status: 200, message: "Deleted successfully" };
  },

  async getById(id) {
    const plan = await Plan.findByPk(id, {
      include: [
        {
          association: "plan_projects",
          include: [
            { association: "project" },
            { association: "version" }
          ]
        }
      ]
    });


    if (!plan) {
      return { success: false, status: 404, message: "Plan not found" };
    }

    return { success: true, status: 200, data: plan };
  },

  async getAll(query) {
    const {
      page,
      perPage,
      sortField = "created_at",
      sortOrder = "desc",
      searchText = "",
      searchField = "",
      searchOperator = "",
    } = query;

    const result = await paginate(
      ({ offset, limit, sortField, sortOrder, where }) =>
        Plan.findAndCountAll({
          where,
          offset,
          limit,
          order: [[sortField, sortOrder]],
          include: [
            {
              association: "plan_projects",
              include: [
                { association: "project" },
                { association: "version" }
              ]
            }
          ]
        }),
      page,
      perPage,
      sortField,
      sortOrder,
      searchText,
      searchField,
      searchOperator,
      Plan
    );

    return { success: true, status: 200, ...result };
  },

  async addProjectsToPlan( {id, projectVersionIds, req}) {
    // Get the plan

    const plan = await Plan.findByPk(id,{
      include: [{ association: "recent_snapshot", required: false  }]
    });

    if (!plan) {
      return { success: false, status: 404, message: "Plan not found" };
    }

    // Validate versions exist
    const planVersion = await ModuleFeatureSnapshot.findAll({
      where: { id: { [Op.in]: projectVersionIds } },
      attributes: ["id", "project_id"],
      raw: true
    });

    if (planVersion.length !== projectVersionIds.length) {
      return { success: false, status: 400, message: "Some project versions not found" };
    }

    // Extract project_ids
    const projectMap = {};
    planVersion.forEach(s => { projectMap[s.project_id] = s.id; });
    const projectIds = Object.keys(projectMap);


    // Plan type check
    if (plan.type !== "bundle" && projectIds.length > 1) {
      return { success: false, status: 400, message: "Individual plan can only have one project" };
    }


    // Check if any of these projects are already assigned to this plan
    const existing = await PlanProject.findAll({
      where: {
        plan_id: id,
        project_id: { [Op.in]: projectIds }
      },
      raw: true
    });

    if (existing.length > 0) {
      return { success: false, status: 400, message: "Some projects already assigned to plan" };
    }

    // Build insert data
    const planProjectsData = projectIds.map(pid => ({
      plan_id: id,
      project_id: pid,
      version_id: projectMap[pid]
    }));

    let queries = [];
    let planProject ;    

    queries.push(
      //  Insert
      {
        action: "bulk_create",
        queryCallBack: async (t) => {
          planProject = await PlanProject.bulkCreate(planProjectsData,{
            ...withContext(req),
            transaction: t,
          });

          return planProject;



        },
        updated_columns: Object.keys(planProjectsData),
        model : PlanProject,
        
      },

     // Mark the versions as used
      {
        action: "bulk_update",
        queryCallBack: async (t) => {
          return await ModuleFeatureSnapshot.update(
            { is_used: true },
            { where: { id: { [Op.in]: projectVersionIds } },
              ...withContext(req),
              transaction: t,
            }
          );
        },
        updated_columns: ["is_used"],
        model : ModuleFeatureSnapshot,
      }
    );

    queries.push(...await this.createPlanSnapshot(plan,  req));
  

    // all database actions here 
    await queryMultipleWithAuditLog({
      req, 
      operations: queries
    });

    return { success: true, status: 200, message: "Projects added to plan successfully" };
  },

  async removeProjectsFromPlan({ id, projectVersionIds, req }) {
    // Get the plan with its recent snapshot

    const plan = await Plan.findByPk(id, {
      include: [{ association: "recent_snapshot", required: false  }]
    });

    if (!plan) {
      return { success: false, status: 404, message: "Plan not found" };
    }


    // Check if these projects are actually assigned to this plan
    const existing = await PlanProject.findAll({
      where: {
        plan_id: id,
        version_id: { [Op.in]: projectVersionIds }
      },
      attributes: ["project_id", "version_id"],
      raw: true
    });


    if (existing.length !== projectVersionIds.length) {
      return { success: false, status: 400, message: "Some projects not assigned to this plan" };
    }

    // Extract the version IDs linked to these projects
    const versionIds = existing.map(e => e.version_id);

    let queries = [];

    let planProjectToBeSnapshoted ;

    queries.push(
      // Delete PlanProject entries
      {
        action: "bulk_delete",
        queryCallBack: async (t) => {

          const planProject =  await PlanProject.destroy({
            where: {
              plan_id: id,
              version_id: { [Op.in]: projectVersionIds }
            },
            ...withContext(req),
            transaction: t
          });

          return planProject;
          
        },
        updated_columns: [], // nothing updated, just deleted
        model: PlanProject
      },
    );


    queries.push(...await this.createPlanSnapshot(plan, req));

    // Execute all DB actions with audit log
    await queryMultipleWithAuditLog({
      req,
      operations: queries
    });

    return { success: true, status: 200, message: "Projects removed from plan successfully" };
  },

  async createPlanSnapshot(plan, req) {
    let queries = [];
    let snapshotId;

    const { id, created_at, updated_at, deleted_at, recent_snapshot_id, ...planData } = plan.toJSON();

    // If there’s an unused snapshot already
    if (plan.recent_snapshot && !plan.recent_snapshot.is_used) {
      snapshotId = plan.recent_snapshot.id;

      // Clear old project mappings inside transaction
      queries.push({
        req,
        action: "bulk_delete",
        queryCallBack: async (t) => {
          return await PlanProjectSnapshot.destroy({
            where: { plan_snapshot_id: snapshotId },
            transaction: t
          });
        },
        updated_columns: [],
        model: PlanProjectSnapshot
      });

    } else {
      // Create new snapshot
      planData.plan_id = plan.id;
      planData.is_used = false;

      queries.push({
        req,
        action: "create",
        queryCallBack: async (t) => {
          const newSnapshot = await PlanSnapshot.create(planData, {
            ...withContext(req),
            transaction: t
          });
          snapshotId = newSnapshot.id; // set here inside transaction
          return newSnapshot;
        },
        updated_columns: Object.keys(planData)
      });

      // Update plan’s recent snapshot id
      queries.push({
        req,
        action: "update",
        queryCallBack: async (t) => {
          return await plan.update(
            { recent_snapshot_id: snapshotId },
            { ...withContext(req), transaction: t }
          );
        },
        updated_columns: ["recent_snapshot_id"]
      });
    }

    // Create PlanProjectSnapshot entries AFTER deletion
    queries.push({
      req,
      action: "bulk_create",
      queryCallBack: async (t) => {
        const planProjectToBeSnapshoted = await PlanProject.findAll({
          where: { plan_id: plan.id },
          attributes: ["plan_id", "project_id", "version_id"],
          raw: true,
          transaction: t
        });

        const planProjectSnapshots = planProjectToBeSnapshoted.map(pp => ({
          plan_snapshot_id: snapshotId,
          project_id: pp.project_id,
          version_id: pp.version_id
        }));

        return await PlanProjectSnapshot.bulkCreate(planProjectSnapshots, {
          ...withContext(req),
          transaction: t
        });
      },
      model: PlanProjectSnapshot
    });

    return queries;
  }

};

