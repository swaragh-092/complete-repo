// Created: 20th Apr 2026
// Description: Page service — CRUD and hierarchy management for Site-type projects.
// Pages are the top-level structural entity, replacing Features in Application-type.
// Hierarchy: Page → Section → Component
// Version: 1.0.0

const {
  withContext,
  auditLogCreateHelperFunction,
  auditLogUpdateHelperFunction,
  auditLogDeleteHelperFunction,
  giveValicationErrorFormal,
  paginateHelperFunction,
} = require('../../util/helper');
const { createNotification } = require('../notification/notification.service');
const { Op, Sequelize } = require('sequelize');
const { authClient } = require('../serviceClients');
const { DOMAIN } = require('../../config/config');

class PageService {
  /**
   * Create a new page under a project/department.
   */
  async createPage(req, data) {
    const { Page, Project } = req.db;
    try {
      if (!data.project_id) {
        return { success: false, status: 400, message: 'project_id is required.' };
      }

      const project = await Project.findByPk(data.project_id);
      if (!project) {
        return { success: false, status: 404, message: 'Project not found' };
      }
      if (project.type !== 'site') {
        return { success: false, status: 400, message: 'Pages are only available for Site-type projects' };
      }

      if (data.parent_page_id) {
        const parent = await Page.findByPk(data.parent_page_id);
        if (!parent) {
          return { success: false, status: 404, message: 'Parent page not found' };
        }
        if (parent.project_id !== data.project_id) {
          return { success: false, status: 400, message: 'Parent page must belong to the same project' };
        }
      }

      const page = await auditLogCreateHelperFunction({ model: Page, data, req });

      try {
        await createNotification(req, {
          scope: 'project_department',
          title: `New page in ${project.name}`,
          message: `Page "${data.name}" has been created`,
          triggeredById: req?.user?.id,
          projectId: project.id,
          departmentId: data.department_id,
          entityType: 'page',
          entityId: page.id,
        });
      } catch (notifErr) {
        console.error('Notification error (non-fatal):', notifErr?.message || notifErr);
      }

      return { success: true, status: 201, data: page };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return { success: false, status: 422, message: 'Validation Error', errors: giveValicationErrorFormal(err) };
      }
      throw err;
    }
  }

  /**
   * Get all pages for a project/department (flat list with sub-page count).
   */
  async getPagesByDepartment(req, projectId, departmentId) {
    const { Page } = req.db;

    const pages = await Page.findAll({
      where: { project_id: projectId, department_id: departmentId },
      order: [['created_at', 'ASC']],
      include: [
        { association: 'subPages', attributes: ['id', 'name'] },
        { association: 'parentPage', attributes: ['id', 'name'] },
      ],
    });

    // Enrich assignee_id with user details
    const assigneeIds = [...new Set(pages.map(p => p.assignee_id).filter(Boolean))];
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

    // Bulk-fetch component stats for all pages in one query
    const { Component } = req.db;
    const pageIds = pages.map(p => p.id);
    let componentsByPage = {};
    if (pageIds.length > 0 && Component) {
      try {
        const components = await Component.findAll({
          where: { page_id: pageIds },
          attributes: ['page_id', 'status', 'story_points', 'total_work_time'],
        });
        for (const c of components) {
          if (!componentsByPage[c.page_id]) componentsByPage[c.page_id] = [];
          componentsByPage[c.page_id].push(c);
        }
      } catch (_) { /* stats are best-effort */ }
    }

    const enriched = pages.map(page => {
      const plain = page.toJSON ? page.toJSON() : { ...page };
      if (plain.assignee_id && userDetailsMap[plain.assignee_id]) {
        plain.assignee_details = userDetailsMap[plain.assignee_id];
      }
      // Compute per-page progress & work time
      const items = componentsByPage[plain.id] || [];
      const totalItems = items.length;
      const completedItems = items.filter(i => i.status === 'completed').length;
      const totalPoints = items.reduce((s, i) => s + (i.story_points || 0), 0);
      const completedPoints = items.filter(i => i.status === 'completed').reduce((s, i) => s + (i.story_points || 0), 0);
      const totalWorkTime = items.reduce((s, i) => s + (i.total_work_time || 0), 0); // minutes
      plain.page_progress = totalPoints > 0
        ? Math.round((completedPoints / totalPoints) * 100)
        : totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      plain.page_total_work_time = totalWorkTime; // minutes
      plain.page_completed_items = completedItems;
      plain.page_total_items = totalItems;
      return plain;
    });

    return { success: true, status: 200, data: enriched };
  }

  /**
   * Get a single page with its sections.
   */
  async getPage(req, pageId) {
    const { Page, Section } = req.db;

    const page = await Page.findByPk(pageId, {
      include: [
        {
          association: 'sections',
          where: { deleted_at: null },
          required: false,
          order: [['order_index', 'ASC']],
          include: [{ association: 'subSections', attributes: ['id', 'name', 'order_index'] }],
        },
        { association: 'subPages', attributes: ['id', 'name', 'url_slug'] },
        { association: 'parentPage', attributes: ['id', 'name'] },
      ],
    });

    if (!page) {
      return { success: false, status: 404, message: 'Page not found' };
    }

    return { success: true, status: 200, data: page };
  }

  /**
   * Update a page.
   */
  async updatePage(req, pageId, data) {
    const { Page } = req.db;
    try {
      const page = await Page.findByPk(pageId);
      if (!page) {
        return { success: false, status: 404, message: 'Page not found' };
      }

      await auditLogUpdateHelperFunction({ model: Page, instance: page, data, req });

      return { success: true, status: 200, data: page };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return { success: false, status: 422, message: 'Validation Error', errors: giveValicationErrorFormal(err) };
      }
      throw err;
    }
  }

  /**
   * Soft-delete a page. Cascades to sections and components in the service layer
   * because Sequelize paranoid does not auto-cascade soft deletes.
   */
  async deletePage(req, pageId) {
    const { Page, Section, Component } = req.db;

    const page = await Page.findByPk(pageId);
    if (!page) {
      return { success: false, status: 404, message: 'Page not found' };
    }

    // Soft-delete all components under sections of this page
    const sections = await Section.findAll({ where: { page_id: pageId } });
    for (const section of sections) {
      await Component.destroy({
        where: { section_id: section.id },
        ...withContext(req),
      });
    }

    // Soft-delete all sections under this page
    await Section.destroy({
      where: { page_id: pageId },
      ...withContext(req),
    });

    await auditLogDeleteHelperFunction({ model: Page, instance: page, req });

    return { success: true, status: 200, message: 'Page deleted successfully' };
  }

  /**
   * Approve or reject a page (called by project lead)
   */
  async approvePage(req, pageId, { status }) {
    const { Page } = req.db;
    const page = await Page.findByPk(pageId);
    if (!page) {
      return { success: false, status: 404, message: 'Page not found' };
    }

    if (status === 'approved') {
      page.approval_status = 'approved';
      page.approved_by = req.user?.id;
    } else {
      page.approval_status = 'rejected';
    }

    await page.save();

    return { success: true, status: 200, data: page };
  }
}

module.exports = new PageService();
