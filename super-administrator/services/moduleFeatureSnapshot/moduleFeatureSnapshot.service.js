// Author : Gururaj
// Created: 31th July 2025
// Description: ModuleFeautre all shapshot service maintained here 
// Version: 1.0.0
// Modified: 


const { Op } = require("sequelize");
const { ModuleFeatureSnapshot, SnapshotModule, SnapshotModuleFeature, ModuleVersion, ModuleFeature } = require("../../models");
const { withContext } = require("../../util/helper");
const { queryWithLogAudit } = require("../auditLog.service");

// this will find the existing sanpshot with module and feautres, if no snapshot exists then return null 
exports.findExistingSnapshot = async (project) => {
  const latestSnapshotVersion = await ModuleFeatureSnapshot.findOne({
    where: { project_id: project.id },
    order: [['version', 'DESC']],
    include: {
      model: SnapshotModule,
      as: "snapshot_modules",
      include: {
        model: SnapshotModuleFeature,
        as: "snapshot_module_features",
      },
    },
  });

  return latestSnapshotVersion;
};


// create new snapshot of moduleFeatures snapshot main table (not snapshot of inside module and features) as new version 
exports.createSnapshotVersion = async ({project=null, existingSnapshot = null, req}) => { // if no existing snapshot is there then project is required
    const newSnapShotUpdateData = {
      version: Math.floor(parseFloat(existingSnapshot?.version) || 0) + 1,
      is_used: false,
      ...(existingSnapshot ? {project_id : existingSnapshot.project_id} : { project_id: project?.id })
    };

    return await queryWithLogAudit({
      action: 'create',
      req,
      updated_columns: Object.keys(newSnapShotUpdateData),
      queryCallBack: async (t) => {
        return await ModuleFeatureSnapshot.create(newSnapShotUpdateData, { transaction: t, ...withContext(req) });
      },
    });
}

// this will update the version of moduleFeatureSnapshot
exports.updateVersionOfExistingSnapshotVersion = async ({req, existingSnapshot}) => {
    existingSnapshot.version = parseFloat(existingSnapshot.version || 0) + 0.01;

    const updateQuery = async (t) => {
      return await existingSnapshot.save({ ...withContext(req), transaction: t });
    };

    return await queryWithLogAudit({
      req,
      action: "update",
      queryCallBack: updateQuery,
      updated_columns: ["version"],
      snapshot: null,
    });
}

// this creates snapshot new module (only one ) for module feature snapshot
const createNewSnapshotModule = async ({newSnapshot, module, req}) => {
    const newModUpdateData = {
        module_feature_snapshot_id: newSnapshot.id,
        module_version_id: module.module_version_id,
    };
    
    const newMod = await queryWithLogAudit({
    action: 'create',
    req,
    updated_columns: Object.keys(newModUpdateData),
    queryCallBack: async (t) => {
        return await SnapshotModule.create(newModUpdateData, { transaction: t, ...withContext(req) });
    },
    });

    return newMod;
}

// this creates takes data from old snapshot module and create new one 
const bulkCreateSnapshotModuleFeaturesFromOldModule = async ({oldModuleWithFeatures, newModule, req}) => {
    const features = oldModuleWithFeatures.snapshot_module_features.map((f) => ({
        snapshot_module_id: newModule.id,
        feature_id: f.feature_id,
    }));
    await queryWithLogAudit({
        action: 'bulk_create',
        req,
        updated_columns: Object.keys(features),
        snapshot : features,
        queryCallBack: async (t) => {
            return await SnapshotModuleFeature.bulkCreate(features, {
                transaction: t,
                ...withContext(req),
            });
        },
    });
}

// create or delete shapshots of module features (based on isDelete)
exports.createOrDeleteSnapshotModuleFeatures = async ({ snapshotModule, feature_ids, req, isDelete = false }) => {
  const [existingFeatures, validFeatureRecords] = await Promise.all([
    SnapshotModuleFeature.findAll({ where: { snapshot_module_id: snapshotModule.id } }),
    ModuleFeature.findAll({
        where: {
            id: feature_ids,
            module_id: snapshotModule.module_version.module.id,
        },
        attributes: ['id'],
    }),
  ]);

  const existingFeatureIds = new Set(existingFeatures.map(f => f.feature_id));
  const validFeatureIds = new Set(validFeatureRecords.map(f => f.id));

  const toEdit = [];
  const skipped_features = [];

  for (const fid of feature_ids) {
    if (!validFeatureIds.has(fid)) {
      skipped_features.push({ feature_id: fid, reason: 'invalid_feature_for_module' });
      continue;
    }

    const alreadyExists = existingFeatureIds.has(fid);

    if (isDelete && alreadyExists) {
      toEdit.push({ snapshot_module_id: snapshotModule.id, feature_id: fid });
    } else if (!isDelete && !alreadyExists) {
      toEdit.push({ snapshot_module_id: snapshotModule.id, feature_id: fid });
    } else {
      skipped_features.push({
        feature_id: fid,
        reason: isDelete ? 'not_present_to_delete' : 'already_present',
      });
    }
  }

  if (toEdit.length > 0) {
    await queryWithLogAudit({
      action: isDelete ? 'bulk_delete' : 'bulk_create',
      req,
      updated_columns: ['snapshot_module_id', 'feature_id'],
      snapshot: isDelete
        ? await SnapshotModuleFeature.findAll({
            where: {
              [Op.or]: toEdit.map(({ snapshot_module_id, feature_id }) => ({ snapshot_module_id, feature_id })),
            },
          })
        : null,
      queryCallBack: async (t) => {
        if (!isDelete) {
          return await SnapshotModuleFeature.bulkCreate(toEdit, {
            transaction: t,
            ...withContext(req),
          });
        } else {
          return await SnapshotModuleFeature.destroy({
            where: {
              [Op.or]: toEdit.map(({ snapshot_module_id, feature_id }) => ({ snapshot_module_id, feature_id })),
            },
            transaction: t,
            ...withContext(req),
          });
        }
      },
    });
  }

  return {
    ...(isDelete
      ? { removed_feature_ids: toEdit.map(f => f.feature_id) }
      : { added_feature_ids: toEdit.map(f => f.feature_id) }),
    skipped_features,
  };
};


// create new feature and module shopshot by taking from exixtign snapshot
exports.createNewModuleFeatureSnapshot = async ({existingSnapshot, req}) => {
    // Create new snapshot version
    const newSnapshot = await this.createSnapshotVersion({existingSnapshot, req});

    const oldModules = existingSnapshot.snapshot_modules || [];
    const moduleMap = new Map(); // old module_id → new snapshot_module.id

    for (const mod of oldModules) {
      const newMod = await createNewSnapshotModule({req, module: mod, newSnapshot});
      moduleMap.set(mod.id, newMod.id);
      if (mod.snapshot_module_features?.length > 0) {
        await bulkCreateSnapshotModuleFeaturesFromOldModule({oldModuleWithFeatures : mod, newModule : newMod, req});
      }
    }
    return newSnapshot;
}

// create or delete module from module feature snapshot (based on is delete)
exports.createOrDeleteModuleSnapshots = async ({ moduleFeatureSnapshot, req, module_version_ids, isDelete = false }) => {
  // Step 1: Fetch valid ModuleVersion records
  const validVersions = await ModuleVersion.findAll({
    where: { id: module_version_ids },
    attributes: ['id', 'module_id'],
  });


  const foundIds = validVersions.map(v => v.id);
  const skipped = module_version_ids
    .filter(id => !foundIds.includes(id))
    .map(id => ({ module_version_id: id, reason: "invalid id" }));

  // Map of module_version_ids => module_version_id (overwrites if duplicate module_version_ids passed)
  const validVersionMap = new Map();
  for (const version of validVersions) {
    validVersionMap.set(version.module_id, version.id);
  }

  // Step 2: Get existing snapshot modules for this snapshot
  const existingSnapshotModules = await SnapshotModule.findAll({
    where: { module_feature_snapshot_id: moduleFeatureSnapshot.id },
    include: {
      model: ModuleVersion,
      as: 'module_version',
      attributes: ['id', 'module_id'],
    },
  });


  const existingMap = new Map(); 
  for (const snapshot of existingSnapshotModules) {

    existingMap.set(snapshot.module_version.module_id, {
      snapshot_module_id: snapshot.id,
      module_version_id: snapshot.module_version_id,
    });
  }

  const toAdd = [];
  const toRemove = [];

  for (const [module_id, module_version_id] of validVersionMap) {
    const existing = existingMap.get(module_id);

    if (!isDelete) {
      if (existing?.module_version_id === module_version_id) {
        skipped.push({ module_id, module_version_id, reason: "already exists" });
        continue;
      }

      if (existing) {
        toRemove.push(existing.snapshot_module_id);
      }

      toAdd.push({
        module_feature_snapshot_id: moduleFeatureSnapshot.id,
        module_version_id,
      });
    } else {
      if (existing?.module_version_id === module_version_id) {
        toRemove.push(existing.snapshot_module_id);
      } else {
        skipped.push({ module_id, module_version_id, reason: "not present or version mismatch" });
      }
    }
  }

  // Step 3: Apply DB changes in audit transaction
  if (toRemove.length || toAdd.length) {
    await queryWithLogAudit({
      req,
      action: isDelete ? "bulk_delete" : "bulk_update",
      updated_columns: ["module_feature_snapshot_id", "module_version_id"],
      snapshot: isDelete
        ? await SnapshotModule.findAll({ where: { id: toRemove } })
        : null,
      queryCallBack: async (t) => {
        if (toRemove.length) {
          await SnapshotModule.destroy({
            where: { id: toRemove },
            transaction: t,
            ...withContext(req),
          });
        }

        if (!isDelete && toAdd.length) {
          await SnapshotModule.bulkCreate(toAdd, {
            transaction: t,
            ...withContext(req),
          });
        }
      },
    });
  }

  return {
    added: toAdd.map(e => e.module_version_id),
    removed: toRemove,
    skipped,
  };
};

