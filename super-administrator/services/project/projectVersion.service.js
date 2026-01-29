// Author: Gururaj
// Created: 31th July 2025
// Description: service for project version (snapshot of madules and features of that version ).
// Version: 1.0.0

const { Project, SnapshotModule, ModuleVersion, SnapshotModuleFeature } = require("../../models");
const { findExistingSnapshot, createNewModuleFeatureSnapshot, updateVersionOfExistingSnapshotVersion, createSnapshotVersion, createOrDeleteModuleSnapshots, createOrDeleteSnapshotModuleFeatures } = require("../moduleFeatureSnapshot/moduleFeatureSnapshot.service");




exports.addModulesToProject = async ({ req, data }) => {

  const { project_id, module_version_ids } = data;
  // validation
  if (!project_id || !Array.isArray(module_version_ids) || module_version_ids.length === 0) {
    return { success: false, status: 404, message: "plan_id and module_ids[] are required" };
  }
  const project = await Project.findByPk(project_id);
  if (!project) return { success: false, status: 404, message: "Project not found" };

  // find exixting snapshot of module feature snapshot for that plan 
  const existingSnapshot = await findExistingSnapshot(project);
  let snapshotToUse = null;

  // if no shopshot exists or is already used for subsctiption then create new one
  if (existingSnapshot && existingSnapshot.is_used) {
    const newSnapshot = await createNewModuleFeatureSnapshot({existingSnapshot, req});
    snapshotToUse = newSnapshot;

  } else if (existingSnapshot) {
    // else if exists and not used then update the version
    snapshotToUse = await updateVersionOfExistingSnapshotVersion({existingSnapshot, req});
  } else {
    // create new snapshot as new verion
    snapshotToUse = await createSnapshotVersion({req, project});
  }

  // add modules for snapshot
  const addedModulesResult = await createOrDeleteModuleSnapshots({moduleFeatureSnapshot : snapshotToUse, req, module_version_ids});

  const addedModules = addedModulesResult;

  return {
    success: true,
    status: 200,
    data: {
      project: {...project.get({ plain: true }), version : await snapshotToUse.reload({include: {
                    model: SnapshotModule,
                    as: "snapshot_modules",
                    include: {
                    model: SnapshotModuleFeature,
                    as: "snapshot_module_features",
                    },
                },})},
      ...addedModules,
      reused_snapshot: snapshotToUse.id === existingSnapshot?.id,
    },
  };
};

exports.removeModulesFromProject = async ({ req, data }) => {
  const { project_id, module_version_ids } = data;
   // validation
  if (!project_id || !Array.isArray(module_version_ids) || module_version_ids.length === 0) {
    return { success: false, status: 404, message: "plan_id and module_ids[] are required" };
  }

  const project = await Project.findByPk(project_id);
  if (!project) return { success: false, status: 404, message: "Project not found" };

  // find existing snapshot of module feature snapshot for that project
  const existingSnapshot = await findExistingSnapshot(project);
  let snapshotToUse = null;
  // if no snapshot exists, cannot proceed with removal
  if (!existingSnapshot) {
    return { success: false, status: 400, message: "No module snapshot associated with the project." };
  }

  // if snapshot exists and is already used for subscription then create a new one
  if (existingSnapshot.is_used) {
    // Clone the snapshot
    const newSnapshot = await createNewModuleFeatureSnapshot({existingSnapshot, req});
    
    snapshotToUse = newSnapshot;

  } else {
    // else if exists and not used then update the version
    snapshotToUse = await updateVersionOfExistingSnapshotVersion({existingSnapshot, req});
  }

  // remove modules from snapshot
  const removedModulesResult = await createOrDeleteModuleSnapshots({moduleFeatureSnapshot : snapshotToUse, req, module_version_ids, isDelete : true});


  return {
    success: true,
    status: 200,
    data: {
      project: {...project.get({ plain: true }), version : await snapshotToUse.reload({include: {
                    model: SnapshotModule,
                    as: "snapshot_modules",
                    include: {
                    model: SnapshotModuleFeature,
                    as: "snapshot_module_features",
                    },
                },})},
      ...removedModulesResult,
      reused_snapshot: snapshotToUse.id === existingSnapshot?.id,
    },
  };
};


exports. addFeaturesToModelOfProject = async ({req, data}) => {
    const { project_id, module_version_id, feature_ids } = data;

  // validation
  if (!project_id || !module_version_id || !Array.isArray(feature_ids) || feature_ids.length === 0) {
    return { success: false, status: 400, message: "project_id, module_version_id and feature_ids[] are required" };
  }
  const project = await Project.findByPk(project_id);

  if (!project) return { success: false, status: 404, message: "Project not found" };

  // find existing snapshot
  const existingSnapshot = await findExistingSnapshot(project);
  let snapshotToUse = null;

  if (!existingSnapshot) {
    return { success: false, status: 400, message: "Project does not have a snapshot." };
  }

  // if already used then create new snapshot of modulefeatureSnapshot
  if (existingSnapshot.is_used) {
    const newSnapshot = createNewModuleFeatureSnapshot({existingSnapshot, req});

    snapshotToUse = newSnapshot;

  } else { 
    // else if exists and not used then update the version
    snapshotToUse = await updateVersionOfExistingSnapshotVersion({existingSnapshot, req});
  }

  // Find snapshot_module for the given module_id
  const targetModule = await SnapshotModule.findOne({
    where: {
      module_feature_snapshot_id: snapshotToUse.id,
      module_version_id,
    },
    include: [
        {
        model: ModuleVersion,
        as: "module_version",
        include: ["module" ]
        }
    ]
  });

  if (!targetModule) {
    return { success: false, status: 404, message: "Module not found in project snapshot" };
  }

  // add feautres to modules for plan
  const updatedSnapshotModuleFeature = await createOrDeleteSnapshotModuleFeatures({snapshotModule : targetModule, feature_ids, req});

  return {
    success: true,
    status: 200,
    data: {
      project: {...project.get({ plain: true }), version : await snapshotToUse.reload({include: {
                    model: SnapshotModule,
                    as: "snapshot_modules",
                    include: {
                    model: SnapshotModuleFeature,
                    as: "snapshot_module_features",
                    },
                },})},
      module_version_id,
      ...updatedSnapshotModuleFeature
    },
  };
};



exports.removeFeaturesFromModelOfProject = async ({ req, data }) => {
  const { project_id, module_version_id, feature_ids } = data;

  
  // validation
  if (!project_id || !module_version_id || !Array.isArray(feature_ids) || feature_ids.length === 0) {
    return { success: false, status: 400, message: "project_id, module_version_id and feature_ids[] are required" };
  }
  const project = await Project.findByPk(project_id);
  if (!project) return { success: false, status: 404, message: "Project not found" };

  // find existing snapshot
  const existingSnapshot = await findExistingSnapshot(project);
  let snapshotToUse = null;


    if (!existingSnapshot) {
        return { success: false, status: 400, message: "Project does not have a snapshot." };
    }

  // if that snapshot is already used then create new one
  if (existingSnapshot.is_used) {
    const newSnapshot = createNewModuleFeatureSnapshot({existingSnapshot, req});

    snapshotToUse = newSnapshot;
  } else { 
    // else if exists and not used then update the version
    snapshotToUse = await updateVersionOfExistingSnapshotVersion({existingSnapshot, req});
  }

  const targetModule = await SnapshotModule.findOne({
    where: {
      module_feature_snapshot_id: snapshotToUse.id,
      module_version_id,
    },
    include: [
        {
        model: ModuleVersion,
        as: "module_version",
        include: ["module" ]
        }
    ]
  });

  if (!targetModule) {
    return { success: false, status: 404, message: "Module not found in project snapshot" };
  }

  // remove the feautres from module for plan
  const updatedSnapshotModuleFeature = await createOrDeleteSnapshotModuleFeatures({snapshotModule : targetModule, feature_ids, req, isDelete : true});


  return {
    success: true,
    status: 200,
    message: "Feature removal completed",
    data: {
      project: {...project.get({ plain: true }), version : await snapshotToUse.reload({include: {
                    model: SnapshotModule,
                    as: "snapshot_modules",
                    include: {
                    model: SnapshotModuleFeature,
                    as: "snapshot_module_features",
                    },
                },})},
      module_version_id,
      updatedSnapshotModuleFeature
    },
  };
};