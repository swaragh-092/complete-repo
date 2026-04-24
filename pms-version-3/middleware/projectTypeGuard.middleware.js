// Created: 20th Apr 2026
// Description: Project-type guard middleware.
// Enforces that a given route is only accessible for projects of the expected type.
// Usage:
//   requireProjectType('site')        — restrict to Site-type projects
//   requireProjectType('application') — restrict to Application-type projects
//
// Project ID is resolved from (in priority order):
//   req.body.projectId  →  req.query.projectId  →  req.params.projectId
// The resolved project is attached to req.project for downstream use.
// Version: 1.0.0

/**
 * @param {'application'|'site'} requiredType
 */
function requireProjectType(requiredType) {
  return async (req, res, next) => {
    try {
      const { Project } = req.db;

      const projectId =
        req.body?.projectId ||
        req.query?.projectId ||
        req.params?.projectId;

      if (!projectId) {
        // Guard skipped: projectId not present on this request (e.g. read-by-item-id routes).
        // Type validation is still enforced inside the service layer.
        return next();
      }

      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }

      if (project.type !== requiredType) {
        return res.status(400).json({
          success: false,
          message: `This operation is only available for ${requiredType}-type projects. Current project is "${project.type}"-type.`,
        });
      }

      // Attach for downstream use
      req.project = project;

      next();
    } catch (err) {
      console.error('[projectTypeGuard] Error:', err?.message || err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
}

module.exports = { requireProjectType };

