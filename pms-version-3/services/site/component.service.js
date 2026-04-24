// Created: 20th Apr 2026
// Description: Component service — full lifecycle management for Site-type leaf work items.
// Mirrors UserStoryService: create, update, timer, helper, dependencies, parent recalculation.
// Hierarchy: Page → Section → Component
// Version: 1.0.0

const {
  withContext,
  auditLogCreateHelperFunction,
  auditLogUpdateHelperFunction,
  auditLogDeleteHelperFunction,
  giveValicationErrorFormal,
} = require('../../util/helper');
const { createNotification } = require('../notification/notification.service');
const { Op, Sequelize } = require('sequelize');
const { authClient } = require('../serviceClients');
const { DOMAIN } = require('../../config/config');

// Status transition order (mirrors UserStory)
const STATUS_ORDER = ['defined', 'in_progress', 'review', 'completed'];

class ComponentService {
  // ─── Create ────────────────────────────────────────────────────────────────

  async createComponent(req, data) {
    const { Component, Section, Project } = req.db;
    try {
      const section = await Section.findByPk(data.section_id);
      if (!section) {
        return { success: false, status: 404, message: 'Section not found' };
      }

      if (!data.project_id) {
        data.project_id = section.project_id;
      }

      if (data.parent_component_id) {
        const parent = await Component.findByPk(data.parent_component_id);
        if (!parent) {
          return { success: false, status: 404, message: 'Parent component not found' };
        }
        if (parent.section_id !== data.section_id) {
          return { success: false, status: 400, message: 'Parent component must belong to the same section' };
        }
      }

      if (!data.type) data.type = 'component';
      if (req.user?.id) data.reporter_id = req.user.id;

      const component = await auditLogCreateHelperFunction({ model: Component, data, req });

      // Fire notifications (non-fatal)
      try {
        const project = await Project.findByPk(data.project_id);
        if (project) {
          await createNotification(req, {
            scope: 'project_department',
            title: `New ${data.type} in ${project.name}`,
            message: `${data.type === 'component' ? 'Component' : 'Task'} "${data.title}" has been created`,
            triggeredById: req?.user?.id,
            projectId: project.id,
            departmentId: data.department_id,
            entityType: 'component',
            entityId: component.id,
          });
          if (data.assigned_to && data.assigned_to !== req?.user?.id) {
            await createNotification(req, {
              scope: 'user',
              title: `Assigned to you: ${data.title}`,
              message: `You have been assigned to ${data.type} "${data.title}"`,
              triggeredById: req?.user?.id,
              targetUserId: data.assigned_to,
              entityType: 'component',
              entityId: component.id,
            });
          }
        }
      } catch (notifErr) {
        console.error('Notification error (non-fatal):', notifErr?.message || notifErr);
      }

      if (data.parent_component_id) {
        await this._recalculateParentStatus(req, data.parent_component_id);
      }

      return { success: true, status: 201, data: component };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return { success: false, status: 422, message: 'Validation Error', errors: giveValicationErrorFormal(err) };
      }
      throw err;
    }
  }

  // ─── Read ──────────────────────────────────────────────────────────────────

  async getComponent(req, componentId) {
    const { Component } = req.db;

    const component = await Component.findByPk(componentId, {
      include: [
        { association: 'issues' },
        { association: 'page', attributes: ['id', 'name', 'project_id'] },
        { association: 'section', attributes: ['id', 'name', 'page_id'] },
        { association: 'sprint', attributes: ['id', 'name', 'status'] },
      ],
    });

    if (!component) {
      return { success: false, status: 404, message: 'Component not found' };
    }

    return { success: true, status: 200, data: component };
  }

  async getComponentsBySection(req, sectionId) {
    const { Component } = req.db;

    const components = await Component.findAll({
      where: { section_id: sectionId },
      order: [['sort_order', 'ASC']],
      include: [
        { association: 'sprint', attributes: ['id', 'name'] },
      ],
    });

    return { success: true, status: 200, data: components };
  }

  // ─── Page-direct methods (flat architecture) ───────────────────────────────

  async createComponentForPage(req, data) {
    const { Component, Page, Project } = req.db;
    try {
      if (data.page_id) {
        const page = await Page.findByPk(data.page_id);
        if (!page) return { success: false, status: 404, message: 'Page not found' };
        if (!data.project_id) data.project_id = page.project_id;
        if (!data.department_id) data.department_id = page.department_id;
      }

      if (!data.type) data.type = 'component';
      if (req.user?.id) data.reporter_id = req.user.id;

      const component = await auditLogCreateHelperFunction({ model: Component, data, req });

      try {
        const project = await Project.findByPk(data.project_id);
        if (project) {
          await createNotification(req, {
            scope: 'project_department',
            title: `New ${data.type} in ${project.name}`,
            message: `"${data.title}" has been created`,
            triggeredById: req?.user?.id,
            projectId: project.id,
            departmentId: data.department_id,
            entityType: 'component',
            entityId: component.id,
          });
          if (data.assigned_to && data.assigned_to !== req?.user?.id) {
            await createNotification(req, {
              scope: 'user',
              title: `Assigned to you: ${data.title}`,
              message: `You have been assigned to ${data.type === 'task' ? 'task' : 'component'} "${data.title}"`,
              triggeredById: req?.user?.id,
              targetUserId: data.assigned_to,
              entityType: 'component',
              entityId: component.id,
            });
          }
        }
      } catch (notifErr) {
        console.error('Notification error (non-fatal):', notifErr?.message || notifErr);
      }

      return { success: true, status: 201, data: component };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return { success: false, status: 422, message: 'Validation Error', errors: giveValicationErrorFormal(err) };
      }
      throw err;
    }
  }

  async getComponentsByPage(req, pageId, query = {}) {
    const { Component } = req.db;
    const where = { page_id: pageId };
    if (query.type) where.type = query.type;

    const page = parseInt(query.page) || 1;
    const perPage = parseInt(query.perPage) || 20;
    const offset = (page - 1) * perPage;

    const { count, rows } = await Component.findAndCountAll({
      where,
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
      include: [{ association: 'sprint', attributes: ['id', 'name'] }],
      limit: perPage,
      offset,
    });

    // Enrich assigned_to with user details
    const assigneeIds = [...new Set(rows.map(r => r.assigned_to).filter(Boolean))];
    let userDetailsMap = {};
    if (assigneeIds.length > 0) {
      try {
        const client = authClient();
        const userResp = await client.post(`${DOMAIN.auth}/auth/internal/users/lookup`, {
          user_ids: assigneeIds,
          user_id_type: 'id',
        });
        const users = userResp.data?.data?.users || [];
        for (const u of users) {
          if (u.id) userDetailsMap[u.id] = { id: u.id, name: u.name, email: u.email };
        }
      } catch (_) { /* enrichment is best-effort */ }
    }

    const enriched = rows.map(row => {
      const plain = row.toJSON ? row.toJSON() : { ...row };
      if (plain.assigned_to && userDetailsMap[plain.assigned_to]) {
        plain.assignee_details = userDetailsMap[plain.assigned_to];
      }
      return plain;
    });

    return {
      success: true,
      status: 200,
      data: { data: enriched, total: count, page, perPage, totalPages: Math.ceil(count / perPage) },
    };
  }

  async getGlobalComponents(req, projectId) {
    const { Component } = req.db;

    const components = await Component.findAll({
      where: { project_id: projectId, is_global: true },
      order: [['sort_order', 'ASC']],
      include: [{ association: 'sprint', attributes: ['id', 'name'] }],
    });

    // Enrich assigned_to with user details
    const assigneeIds = [...new Set(components.map(c => c.assigned_to).filter(Boolean))];
    let userDetailsMap = {};
    if (assigneeIds.length > 0) {
      try {
        const client = authClient();
        const userResp = await client.post(`${DOMAIN.auth}/auth/internal/users/lookup`, {
          user_ids: assigneeIds,
          user_id_type: 'id',
        });
        const users = userResp.data?.data?.users || [];
        for (const u of users) {
          if (u.id) userDetailsMap[u.id] = { id: u.id, name: u.name, email: u.email };
        }
      } catch (_) { /* enrichment is best-effort */ }
    }

    const enriched = components.map(c => {
      const plain = c.toJSON ? c.toJSON() : { ...c };
      if (plain.assigned_to && userDetailsMap[plain.assigned_to]) {
        plain.assignee_details = userDetailsMap[plain.assigned_to];
      }
      return plain;
    });

    return { success: true, status: 200, data: enriched };
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async updateComponent(req, componentId, data) {
    const { Component } = req.db;
    try {
      const component = await Component.findByPk(componentId);
      if (!component) {
        return { success: false, status: 404, message: 'Component not found' };
      }

      // Due-date lock: only team leads can change an existing due date
      if (data.due_date !== undefined && component.due_date && data.due_date !== component.due_date) {
        const isLead = await this._isTeamLead(req, component.project_id);
        if (!isLead) {
          return {
            success: false,
            status: 403,
            code: 'DUE_DATE_LOCKED',
            message: 'Due date is locked. Submit a change request for team-lead approval.',
          };
        }
      }

      // Block direct status backward-reversal for non-leads
      if (data.status !== undefined) {
        const isLead = await this._isTeamLead(req, component.project_id);
        const currentIdx = STATUS_ORDER.indexOf(component.status);
        const newIdx = STATUS_ORDER.indexOf(data.status);
        if (!isLead && newIdx >= 0 && currentIdx >= 0 && newIdx < currentIdx) {
          return {
            success: false,
            status: 403,
            code: 'STATUS_REVERT_BLOCKED',
            message: 'Cannot revert status. Submit a change request for team-lead approval.',
          };
        }
      }

      await auditLogUpdateHelperFunction({ model: component, data, req });

      // Auto-unblock dependents: when component becomes 'completed', lift 'blocked' status
      // on any component/task that was blocked *only* by this one
      if (data.status === 'completed' && component.status !== 'completed') {
        await this._tryUnblockDependents(req, component.id, component.project_id);
      }

      if (component.parent_component_id) {
        await this._recalculateParentStatus(req, component.parent_component_id);
      }

      return { success: true, status: 200, data: component };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return { success: false, status: 422, message: 'Validation Error', errors: giveValicationErrorFormal(err) };
      }
      throw err;
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async deleteComponent(req, componentId) {
    const { Component } = req.db;

    const component = await Component.findByPk(componentId);
    if (!component) {
      return { success: false, status: 404, message: 'Component not found' };
    }

    // Soft-delete all sub-components recursively
    await Component.destroy({ where: { parent_component_id: componentId }, ...withContext(req) });

    await auditLogDeleteHelperFunction({ model: Component, instance: component, req });

    if (component.parent_component_id) {
      await this._recalculateParentStatus(req, component.parent_component_id);
    }

    return { success: true, status: 200, message: 'Component deleted successfully' };
  }

  // ─── Timer ─────────────────────────────────────────────────────────────────

  async getActiveTimer(req) {
    const { Component } = req.db;
    const userId = req.user?.id;
    if (!userId) return { success: true, status: 200, data: null };

    const running = await Component.findOne({
      where: { timer_status: 'running', timer_started_by: userId },
    });
    return { success: true, status: 200, data: running || null };
  }

  async startTimer(req, componentId) {
    const { Component, UserStory } = req.db;
    const userId = req.user?.id;
    const now = new Date();

    const component = await Component.findByPk(componentId);
    if (!component) {
      return { success: false, status: 404, message: 'Component not found' };
    }
    if (component.timer_status === 'running') {
      return { success: false, status: 400, message: 'Timer is already running' };
    }
    if (component.status === 'completed') {
      return { success: false, status: 400, message: 'Cannot start timer on a completed item' };
    }

    // ── Stop all other running component timers started by this user ──────
    if (userId) {
      const others = await Component.findAll({
        where: { timer_status: 'running', timer_started_by: userId },
      });
      for (const other of others) {
        const elapsed = other.timer_started_at
          ? Math.floor((now.getTime() - new Date(other.timer_started_at).getTime()) / 60000)
          : 0;
        await other.update(
          { timer_status: 'stopped', timer_started_at: null, timer_started_by: null, total_work_time: (other.total_work_time || 0) + elapsed },
          withContext(req)
        );
      }

      // ── Also stop any running UserStory timers ────────────────────────
      try {
        if (UserStory) {
          await UserStory.update(
            { live_status: 'stop' },
            { where: { live_status: 'running', assigned_to: userId }, ...withContext(req) }
          );
        }
      } catch (_) { /* cross-model stop is best-effort */ }
    }

    await component.update(
      { timer_status: 'running', timer_started_at: now, timer_started_by: userId || null },
      withContext(req)
    );

    return { success: true, status: 200, data: component };
  }

  async stopTimer(req, componentId) {
    const { Component } = req.db;

    const component = await Component.findByPk(componentId);
    if (!component) {
      return { success: false, status: 404, message: 'Component not found' };
    }
    if (component.timer_status !== 'running') {
      return { success: false, status: 400, message: 'Timer is not running' };
    }

    const elapsed = component.timer_started_at
      ? Math.floor((Date.now() - new Date(component.timer_started_at).getTime()) / 60000)
      : 0;

    await component.update(
      {
        timer_status: 'stopped',
        timer_started_at: null,
        timer_started_by: null,
        total_work_time: (component.total_work_time || 0) + elapsed,
      },
      withContext(req)
    );

    return { success: true, status: 200, data: component };
  }

  // ─── Progress calculation ─────────────────────────────────────────────────

  /**
   * Calculate progress for a page based on story_points of its components/tasks.
   * completed_points / total_points * 100 (fallback: completed_count / total_count).
   */
  async getPageProgress(req, pageId) {
    const { Component } = req.db;

    const items = await Component.findAll({
      where: { page_id: pageId },
      attributes: ['id', 'status', 'story_points', 'total_work_time'],
    });

    const totalPoints = items.reduce((s, i) => s + (i.story_points || 0), 0);
    const completedPoints = items
      .filter(i => i.status === 'completed')
      .reduce((s, i) => s + (i.story_points || 0), 0);
    const totalItems = items.length;
    const completedItems = items.filter(i => i.status === 'completed').length;
    const totalWorkTime = items.reduce((s, i) => s + (i.total_work_time || 0), 0);

    const progress = totalPoints > 0
      ? Math.round((completedPoints / totalPoints) * 100)
      : totalItems > 0
        ? Math.round((completedItems / totalItems) * 100)
        : 0;

    return {
      success: true, status: 200,
      data: { progress, totalPoints, completedPoints, totalItems, completedItems, totalWorkTime },
    };
  }

  /**
   * Calculate progress for a site project based on all pages + global components.
   */
  async getProjectProgress(req, projectId) {
    const { Component, Page } = req.db;

    const pages = await Page.findAll({
      where: { project_id: projectId },
      attributes: ['id'],
    });
    const pageIds = pages.map(p => p.id);

    // Page components/tasks
    const pageItems = pageIds.length > 0
      ? await Component.findAll({
          where: { page_id: pageIds },
          attributes: ['id', 'status', 'story_points', 'total_work_time'],
        })
      : [];

    // Global components
    const globalItems = await Component.findAll({
      where: { project_id: projectId, is_global: true },
      attributes: ['id', 'status', 'story_points', 'total_work_time'],
    });

    const all = [...pageItems, ...globalItems];
    const totalPoints = all.reduce((s, i) => s + (i.story_points || 0), 0);
    const completedPoints = all.filter(i => i.status === 'completed').reduce((s, i) => s + (i.story_points || 0), 0);
    const totalItems = all.length;
    const completedItems = all.filter(i => i.status === 'completed').length;
    const totalWorkTime = all.reduce((s, i) => s + (i.total_work_time || 0), 0);

    const progress = totalPoints > 0
      ? Math.round((completedPoints / totalPoints) * 100)
      : totalItems > 0
        ? Math.round((completedItems / totalItems) * 100)
        : 0;

    return {
      success: true, status: 200,
      data: { progress, totalPoints, completedPoints, totalItems, completedItems, totalWorkTime, pageCount: pages.length },
    };
  }

  // ─── Helper component ──────────────────────────────────────────────────────

  /**
   * Create a helper component that assists the target component.
   * Mirrors the UserStory helper pattern.
   */
  async createHelperComponent(req, targetComponentId, data) {
    const { Component } = req.db;

    const target = await Component.findByPk(targetComponentId);
    if (!target) {
      return { success: false, status: 404, message: 'Target component not found' };
    }
    if (target.component_for === 'help') {
      return { success: false, status: 400, message: 'Cannot create a helper for a helper component' };
    }

    return this.createComponent(req, {
      ...data,
      section_id: target.section_id,
      page_id: target.page_id,
      project_id: target.project_id,
      department_id: data.department_id || target.department_id,
      component_for: 'help',
      helped_for: targetComponentId,
      type: 'task',
      status: 'defined',
    });
  }

  async getHelperComponents(req, targetComponentId) {
    const { Component } = req.db;
    const helpers = await Component.findAll({
      where: { helped_for: targetComponentId },
      order: [['created_at', 'DESC']],
    });
    return { success: true, status: 200, data: helpers };
  }

  async acceptOrRejectHelperComponent(req, helperComponentId, action) {
    const { Component } = req.db;
    const helper = await Component.findByPk(helperComponentId);
    if (!helper || helper.component_for !== 'help') {
      return { success: false, status: 404, message: 'Helper component not found' };
    }
    if (action === 'accept') {
      helper.status = 'in_progress';
    } else {
      helper.status = 'reject';
    }
    await helper.save();
    return { success: true, status: 200, data: helper };
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

  async _isTeamLead(req, projectId) {
    const { ProjectMember } = req.db;
    const userId = req.user?.id;
    if (!userId || !projectId) return false;
    const member = await ProjectMember.findOne({
      where: { project_id: projectId, user_id: userId, project_role: 'lead' },
    });
    return !!member;
  }

  /**
   * When completedComponentId becomes 'completed', lift 'blocked' on any
   * component/task in the same project that depended solely on it.
   */
  async _tryUnblockDependents(req, completedComponentId, projectId) {
    const { SiteItemDependency, Component } = req.db;
    // Find all items that depend on this component (it's their target)
    const edges = await SiteItemDependency.findAll({
      where: {
        project_id: projectId,
        target_type: 'component',
        target_id: completedComponentId,
        source_type: 'component',
      },
    });
    for (const edge of edges) {
      const dependent = await Component.findByPk(edge.source_id);
      if (!dependent || dependent.status !== 'blocked') continue;
      // Check if all of this dependent's other dependencies are also completed
      const allDeps = await SiteItemDependency.findAll({
        where: { project_id: projectId, source_type: 'component', source_id: edge.source_id },
      });
      const allCompleted = await Promise.all(
        allDeps.map(async (d) => {
          if (d.target_type !== 'component') return true;
          const dep = await Component.findByPk(d.target_id);
          return dep?.status === 'completed';
        })
      );
      if (allCompleted.every(Boolean)) {
        await dependent.update({ status: 'in_progress' });
      }
    }
  }

  /**
   * Recalculate and persist parent component status based on its sub-items.
   * Rules mirror UserStoryService._recalculateParentStatus.
   */
  async _recalculateParentStatus(req, parentId) {
    if (!parentId) return;
    const { Component } = req.db;

    const parent = await Component.findByPk(parentId);
    if (!parent) return;

    const subs = await Component.findAll({
      where: { parent_component_id: parentId },
      attributes: ['status'],
    });
    if (subs.length === 0) return;

    const statuses = subs.map((s) => s.status);
    let newStatus;
    if (statuses.every((s) => s === 'completed')) {
      newStatus = 'completed';
    } else if (statuses.every((s) => s === 'defined')) {
      newStatus = 'defined';
    } else {
      newStatus = 'in_progress';
    }

    if (parent.status === newStatus) return;

    const updateData = { status: newStatus };
    if (newStatus === 'completed') {
      updateData.completed_at = new Date();
      if (parent.timer_status === 'running') {
        const elapsed = parent.timer_started_at
          ? Math.floor((Date.now() - new Date(parent.timer_started_at).getTime()) / 60000)
          : 0;
        updateData.timer_status = 'stopped';
        updateData.timer_started_at = null;
        updateData.total_work_time = (parent.total_work_time || 0) + elapsed;
      }
    } else if (parent.status === 'completed') {
      updateData.completed_at = null;
    }

    await parent.update(updateData, withContext(req));
  }

  /**
   * Approve or reject a component (called by project lead)
   */
  async approveComponent(req, componentId, { status }) {
    const { Component } = req.db;
    const component = await Component.findByPk(componentId);
    if (!component) {
      return { success: false, status: 404, message: 'Component not found' };
    }

    if (status === 'approved') {
      component.approval_status = 'approved';
      component.approved_by = req.user?.id;
      component.status = 'completed';
      component.completed_at = new Date();
    } else {
      component.approval_status = 'rejected';
      component.status = 'in_progress';
    }

    await component.save();

    return { success: true, status: 200, data: component };
  }
}

module.exports = new ComponentService();
