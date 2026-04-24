// Created: 20th Apr 2026
// Description: Section service — CRUD and hierarchy management for Site-type projects.
// Sections belong to a Page and can be nested (sub-sections).
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

class SectionService {
  /**
   * Create a new section under a page.
   */
  async createSection(req, data) {
    const { Section, Page, Project } = req.db;
    try {
      const page = await Page.findByPk(data.page_id);
      if (!page) {
        return { success: false, status: 404, message: 'Page not found' };
      }

      // Propagate project_id from page
      if (!data.project_id) {
        data.project_id = page.project_id;
      }

      if (data.parent_section_id) {
        const parent = await Section.findByPk(data.parent_section_id);
        if (!parent) {
          return { success: false, status: 404, message: 'Parent section not found' };
        }
        if (parent.page_id !== data.page_id) {
          return { success: false, status: 400, message: 'Parent section must belong to the same page' };
        }
      }

      const section = await auditLogCreateHelperFunction({ model: Section, data, req });

      try {
        const project = await Project.findByPk(data.project_id);
        if (project) {
          await createNotification(req, {
            scope: 'project_department',
            title: `New section in ${project.name}`,
            message: `Section "${data.name}" has been created`,
            triggeredById: req?.user?.id,
            projectId: project.id,
            departmentId: data.department_id,
            entityType: 'section',
            entityId: section.id,
          });
        }
      } catch (notifErr) {
        console.error('Notification error (non-fatal):', notifErr?.message || notifErr);
      }

      return { success: true, status: 201, data: section };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return { success: false, status: 422, message: 'Validation Error', errors: giveValicationErrorFormal(err) };
      }
      throw err;
    }
  }

  /**
   * Get all sections for a page (ordered by order_index).
   */
  async getSectionsByPage(req, pageId) {
    const { Section } = req.db;

    const sections = await Section.findAll({
      where: { page_id: pageId },
      order: [['order_index', 'ASC']],
      include: [
        { association: 'subSections', attributes: ['id', 'name', 'order_index', 'status'] },
        { association: 'parentSection', attributes: ['id', 'name'] },
        { association: 'sprint', attributes: ['id', 'name', 'status'] },
      ],
    });

    return { success: true, status: 200, data: sections };
  }

  /**
   * Get a single section with its components.
   */
  async getSection(req, sectionId) {
    const { Section } = req.db;

    const section = await Section.findByPk(sectionId, {
      include: [
        {
          association: 'components',
          where: { deleted_at: null },
          required: false,
          order: [['sort_order', 'ASC']],
          include: [{ association: 'subComponents', attributes: ['id', 'title', 'status', 'sort_order'] }],
        },
        { association: 'subSections', attributes: ['id', 'name', 'order_index'] },
        { association: 'parentSection', attributes: ['id', 'name'] },
        { association: 'page', attributes: ['id', 'name', 'url_slug'] },
        { association: 'sprint', attributes: ['id', 'name', 'status'] },
      ],
    });

    if (!section) {
      return { success: false, status: 404, message: 'Section not found' };
    }

    return { success: true, status: 200, data: section };
  }

  /**
   * Update a section.
   */
  async updateSection(req, sectionId, data) {
    const { Section } = req.db;
    try {
      const section = await Section.findByPk(sectionId);
      if (!section) {
        return { success: false, status: 404, message: 'Section not found' };
      }

      await auditLogUpdateHelperFunction({ model: Section, instance: section, data, req });

      return { success: true, status: 200, data: section };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return { success: false, status: 422, message: 'Validation Error', errors: giveValicationErrorFormal(err) };
      }
      throw err;
    }
  }

  /**
   * Soft-delete a section. Cascades to components in the service layer.
   */
  async deleteSection(req, sectionId) {
    const { Section, Component } = req.db;

    const section = await Section.findByPk(sectionId);
    if (!section) {
      return { success: false, status: 404, message: 'Section not found' };
    }

    // Soft-delete all components under this section
    await Component.destroy({
      where: { section_id: sectionId },
      ...withContext(req),
    });

    await auditLogDeleteHelperFunction({ model: Section, instance: section, req });

    return { success: true, status: 200, message: 'Section deleted successfully' };
  }
}

module.exports = new SectionService();
