// Author: Gururaj
// Created: 25th August 2025
// Description: Controller to maintain the main required all get queries.
// Version: 1.0.0

const {
  Project,
  Organization,
  OrganizationSubscription,
  ModuleFeatureSnapshot,
  Database,
} = require("../models");
const ResponseService = require("../services/Response");
const { encrypt } = require("../util/crypto");
const { fieldPicker } = require("../util/helper");
const { Op } = require("sequelize");

// Get the data where required for routing and database for every request
const getData = async (req, res) => {
  const thisAction = { usedFor: "Data", action: "Get" };
  try {
    const allowedFields = [
      { field: "projectDomain", source: "params", as: "project_domain" },
      { field: "organizationId", source: "params", as: "organization_id" },
      { field: "moduleCode", source: "params", as: "module_code" },
    ];
    const data = fieldPicker(req, allowedFields);

    if (!data.project_domain || !data.organization_id || !data.module_code) {
      return ResponseService.apiResponse({
        res,
        status: false,
        message: "Insufficient data",
        status: 422,
        ...thisAction,
      });
    }

    const project = await Project.findOne({
      where: { sub_domain: data.project_domain },
      attributes: ["id", "name", "short_name", "sub_domain", "is_active"],
    });

    if (!project) {
      return ResponseService.apiResponse({
        res,
        status: false,
        message: "Project not found",
        status: 404,
        ...thisAction,
      });
    }

    const organization = await Organization.findOne({
      where: { id: data.organization_id },
      attributes: ["id", "name", "code", "state"],
      include: [],
    });

    if (!organization) {
      return ResponseService.apiResponse({
        res,
        status: false,
        message: "Organization not found",
        status: 404,
        ...thisAction,
      });
    }

    const subscription = await OrganizationSubscription.findOne({
      where: {
        organization_id: data.organization_id,
        status: { [Op.in]: ["active", "trial"] },
        in_pause: false,
      },
      include: [
        {
          association: "plan",
          required: true, // Only include if plan exists
          include: [
            {
              association: "plan_projects_snapshot",
              required: true, // Only include if project snapshot exists
              where: { project_id: project.id },
            },
          ],
        },
      ],
    });

    if (!subscription) {
      return ResponseService.apiResponse({
        res,
        status: false,
        message:
          "No active subscription found for this organization on that project",
        status: 404,
        ...thisAction,
      });
    }

    const moduleFeatureSnapshotId =
      subscription.plan.plan_projects_snapshot[0].version_id;

    const version = await ModuleFeatureSnapshot.findOne({
      where: { id: moduleFeatureSnapshotId },
      include: [
        {
          association: "snapshot_modules",
          required: true, // Only include if snapshot_modules match
          include: [
            {
              association: "module_version",
              required: true, // Only include if module_version exists
              include: [
                {
                  association: "module",
                  required: true,
                  where: {
                    is_active: true,
                    code: data.module_code,
                  },
                },
              ],
            },
            {
              association: "snapshot_module_features",
              required: true, // Only include if snapshot_modules_features exist
              include: [
                {
                  association: "feature",
                  required: true,
                  where: { is_active: true },
                },
              ],
            },
          ],
        },
      ],
    });


    if (!version) {
      return ResponseService.apiResponse({
        res,
        status: false,
        message: "Module or features are not found",
        status: 404,
        ...thisAction,
        data: version,

      });
    }

    const module_version_with_module =
      version.snapshot_modules[0].module_version;
    const features = version.snapshot_modules[0].snapshot_module_features;
    const database = await Database.findOne({
      where: {
        organization_id: data.organization_id,
        module_version_id: module_version_with_module.id,
      },
    });

    console.log("database details", database);

    const result = {
      project,
      organization,
      module_features: { module_version: module_version_with_module, features },
      upstream_container:
        module_version_with_module.docker_container +
        ":" +
        module_version_with_module.port,
      database: database,
    };

    return ResponseService.apiResponse({
      res,
      status: 200,
      success: true,
      data: result,
      ...thisAction,
    });
  } catch (err) {
    console.error("Error While getting data", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

const getAllData = async (req, res) => {
  const thisAction = { usedFor: "Data", action: "Get" };
  try {
    const allowedFields = [
      { field: "organizationId", source: "params", as: "organization_id" },
    ];
    const data = fieldPicker(req, allowedFields);

    if (!data.organization_id) {
      return ResponseService.apiResponse({
        res,
        status: false,
        message: "Insufficient data",
        status: 422,
        ...thisAction,
      });
    }

    const organization = await Organization.findOne({
      where: { id: data.organization_id },
      attributes: ["id", "name", "code", "state"],
    });

    if (!organization) {
      return ResponseService.apiResponse({
        res,
        status: false,
        message: "Organization not found",
        status: 404,
        ...thisAction,
      });
    }

    const subscription = await OrganizationSubscription.findAll({
      where: {
        organization_id: data.organization_id,
        status: { [Op.in]: ["active", "trial"] },
        in_pause: false,
      },
      attributes: ["id", "organization_id", "snapshot_plan_id", "plan_id", "start_date", "end_date", "next_renewal_date", ],
      include: [
        {
          association: "plan",
          attributes: ["id", "name", "type", "plan_id", "billing_cycle"],
          include: [
            {
              association: "plan_projects_snapshot",
              attributes: ["id", "project_id", "plan_snapshot_id", "version_id"],
              include: [
                {
                  association: "version",
                  attributes: ["id", "project_id", "version"],
                  include: [
                    {
                      association: "snapshot_modules",
                      attributes: ["id", "module_version_id", "module_feature_snapshot_id"],
                      separate: true,
                      include: [
                        {
                          association: "module_version",
                          attributes: ["id", "module_id", "version", "docker_container", "port", "version"],
                          include: [
                            {
                              association: "module",
                              attributes: ["id", "name", "code"],
                              where: {
                                is_active: true,
                              },
                            },
                            {
                              association: "database",
                              attributes: ["id", "organization_id", "module_version_id", "key_name", "schema_version"],
                              where:{ organization_id: data.organization_id },
                            }
                          ],
                        },
                        {
                          association: "snapshot_module_features",
                          attributes: ["id", "snapshot_module_id", "feature_id"],
                          include: [
                            {
                              association: "feature",
                              attributes: ["id", "name", "code"],
                              where: { is_active: true },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                }
              ],
            },
          ],
        },
      ],
    });

    const formattedSubscription = mapSubscriptionForClient(subscription);

    return ResponseService.apiResponse({
      res,
      status: 200,
      success: true,
      data: {subscription: formattedSubscription},
      ...thisAction,
    });
  } catch (err) {
    console.error("Error While getting data", err);
    return ResponseService.apiResponse({
      res,
      success: false,
      status: 500,
      ...thisAction,
    });
  }
};

module.exports = { getAllData, getData };


function mapSubscriptionForClient(subscriptions) {
  return subscriptions.map(sub => ({
    subscriptionId: sub.id,
    startDate: sub.start_date,
    endDate: sub.end_date,
    nextRenewalDate: sub.next_renewal_date,

    plan: {
      id: sub.plan.plan_id,
      name: sub.plan.name,
      type: sub.plan.type,
      billingCycle: sub.plan.billing_cycle,

      projects: (sub.plan.plan_projects_snapshot || []).map(p => ({
        projectId: p.project_id,
        version: p.version?.version,

        modules: (p.version?.snapshot_modules || []).map(sm => ({
          id: sm.module_version?.module?.id,
          name: sm.module_version?.module?.name,
          code: sm.module_version?.module?.code,

          runtime: {
            version: sm.module_version?.version,
            container: sm.module_version?.docker_container,
            port: sm.module_version?.port,
          },
          database: sm.module_version?.database[0] ? {
            id: sm.module_version?.database[0]?.id,
            keyName: sm.module_version?.database[0]?.key_name,
            schemaVersion: sm.module_version?.database[0]?.schema_version,
          } : null,

          features: (sm.snapshot_module_features || []).map(f => ({
            id: f.feature?.id,
            name: f.feature?.name,
            code: f.feature?.code,
          })),
        })),
      })),
    },
  }));
}
