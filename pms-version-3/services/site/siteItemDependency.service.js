// Created: 20th Apr 2026
// Description: SiteItemDependency service — polymorphic dependency management
// for Site-type projects (pages, sections, components).
// Application-type projects use UserStoryDependency (untouched).
// Version: 1.0.0

const { Op } = require('sequelize');

// ─── Item lookup helpers ────────────────────────────────────────────────────

/**
 * Look up a site item (page/section/component) by its type string and UUID.
 * Returns null if not found.
 */
async function findSiteItem(db, type, id) {
  switch (type) {
    case 'page':
      return db.Page.findByPk(id);
    case 'section':
      return db.Section.findByPk(id);
    case 'component':
      return db.Component.findByPk(id);
    default:
      return null;
  }
}

// ─── Cycle detection (BFS) ─────────────────────────────────────────────────

/**
 * Check whether adding an edge source→target would create a cycle.
 * Traverses the dependency graph from target upward; if we ever reach source,
 * a cycle would be formed.
 * @returns {boolean} true if a cycle would be created
 */
async function wouldCreateCycle(db, projectId, sourceType, sourceId, targetType, targetId) {
  const { SiteItemDependency } = db;

  const visited = new Set();
  const queue = [{ type: targetType, id: targetId }];

  while (queue.length > 0) {
    const { type: currentType, id: currentId } = queue.shift();
    const key = `${currentType}:${currentId}`;

    if (currentId === sourceId && currentType === sourceType) {
      return true; // cycle detected
    }
    if (visited.has(key)) continue;
    visited.add(key);

    // Follow outgoing edges from current (items that current depends on)
    const next = await SiteItemDependency.findAll({
      where: { project_id: projectId, source_type: currentType, source_id: currentId },
      attributes: ['target_type', 'target_id'],
    });

    for (const dep of next) {
      queue.push({ type: dep.target_type, id: dep.target_id });
    }
  }

  return false;
}

// ─── Service ───────────────────────────────────────────────────────────────

class SiteItemDependencyService {
  /**
   * Add a dependency: source depends on target (target must complete first).
   */
  async addDependency(req, data) {
    const { SiteItemDependency, Project } = req.db;
    const { projectId, sourceType, sourceId, targetType, targetId } = data;

    // Validate types
    const validTypes = ['page', 'section', 'component'];
    if (!validTypes.includes(sourceType) || !validTypes.includes(targetType)) {
      return { success: false, status: 400, message: 'Invalid item type. Must be page, section, or component' };
    }

    // Prevent self-dependency
    if (sourceId === targetId && sourceType === targetType) {
      return { success: false, status: 400, message: 'An item cannot depend on itself' };
    }

    // Validate project
    const project = await Project.findByPk(projectId);
    if (!project || project.type !== 'site') {
      return { success: false, status: 404, message: 'Site-type project not found' };
    }

    // Validate source item exists and belongs to this project
    const sourceItem = await findSiteItem(req.db, sourceType, sourceId);
    if (!sourceItem || sourceItem.project_id !== projectId) {
      return { success: false, status: 404, message: `Source ${sourceType} not found in this project` };
    }

    // Validate target item exists and belongs to this project
    const targetItem = await findSiteItem(req.db, targetType, targetId);
    if (!targetItem || targetItem.project_id !== projectId) {
      return { success: false, status: 404, message: `Target ${targetType} not found in this project` };
    }

    // Check for cycles
    const hasCycle = await wouldCreateCycle(req.db, projectId, sourceType, sourceId, targetType, targetId);
    if (hasCycle) {
      return { success: false, status: 400, message: 'This dependency would create a circular chain' };
    }

    // Check for duplicate
    const existing = await SiteItemDependency.findOne({
      where: { project_id: projectId, source_type: sourceType, source_id: sourceId, target_type: targetType, target_id: targetId },
    });
    if (existing) {
      return { success: false, status: 409, message: 'This dependency already exists' };
    }

    const dep = await SiteItemDependency.create({
      project_id: projectId,
      source_type: sourceType,
      source_id: sourceId,
      target_type: targetType,
      target_id: targetId,
    });

    return { success: true, status: 201, data: dep };
  }

  /**
   * Get all dependencies for a specific item (what it depends on and what depends on it).
   */
  async getDependencies(req, projectId, itemType, itemId) {
    const { SiteItemDependency } = req.db;

    const [blockedBy, blocks] = await Promise.all([
      // Items this item depends on (target must complete first)
      SiteItemDependency.findAll({
        where: { project_id: projectId, source_type: itemType, source_id: itemId },
        attributes: ['id', 'target_type', 'target_id', 'created_at'],
      }),
      // Items that depend on this item
      SiteItemDependency.findAll({
        where: { project_id: projectId, target_type: itemType, target_id: itemId },
        attributes: ['id', 'source_type', 'source_id', 'created_at'],
      }),
    ]);

    return {
      success: true,
      status: 200,
      data: { blockedBy, blocks },
    };
  }

  /**
   * Remove a dependency by its ID.
   */
  async removeDependency(req, dependencyId) {
    const { SiteItemDependency } = req.db;

    const dep = await SiteItemDependency.findByPk(dependencyId);
    if (!dep) {
      return { success: false, status: 404, message: 'Dependency not found' };
    }

    await dep.destroy();

    return { success: true, status: 200, message: 'Dependency removed' };
  }
}

module.exports = new SiteItemDependencyService();
