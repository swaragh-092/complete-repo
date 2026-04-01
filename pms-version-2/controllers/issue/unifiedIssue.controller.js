// Author: Gururaj
// Created: 18th Mar 2026
// Description: Unified work-item controller routing create/update/list requests to the appropriate service based on item type.
// Version: 1.0.0
// Modified:

const ResponseService = require("../../services/Response");
const UserStoryService = require("../../services/userStory/userStory.service");
const IssueService = require("../../services/issue/issue.service");
const FeatureService = require("../../services/feature/feature.service");
const { fieldPicker, sendErrorResponse } = require("../../util/helper");

class UnifiedIssueController {
  // Create any type of work item (Epic, Story, Task, Subtask, Bug)
  static async createWorkItem(req, res) {
    const thisAction = { usedFor: "WorkItem", action: "create" };
    try {
      const { Feature, UserStory, Issue, IssueType } = req.db;
      const { type } = req.body;
      let result;

      // Ensure projectId exists in body for consistancy
      if (!req.body.project_id && req.params.projectId) {
        req.body.project_id = req.params.projectId;
      }

      switch (type ? type.toLowerCase() : "") {
        case "epic":
          // Map to Feature
          // FeatureService expects name, description, department_id, project_id
          const featureData = {
            name: req.body.title,
            description: req.body.description,
            department_id: req.body.department_id,
            project_id: req.body.project_id,
          };
          // Mock req for service compatibility
          const featureReq = {
            ...req,
            body: featureData,
            params: { projectId: req.body.project_id },
          };
          result = await FeatureService.createFeature(featureReq, featureData);
          break;

        case "story":
        case "task":
          // Map to UserStory
          const storyData = {
            title: req.body.title,
            description: req.body.description,
            project_id: req.body.project_id,
            department_id: req.body.department_id,
            type: type.toLowerCase(), // 'story' or 'task'
            feature_id: req.body.parent_id, // Map parent_id to feature_id for stories
            parent_user_story_id: req.body.parent_task_id, // For subtasks
            priority: req.body.priority || "medium",
            assignee: req.body.assignee,
            reporter_id: req.user ? req.user.id : null,
          };
          // If subtask, type is still 'story' or 'task' but has parent? No, usually subtask is a type.
          // UserStory model has self-reference for sub-stories.

          const storyReq = { ...req, body: storyData };
          result = await UserStoryService.createUserStory(storyReq, storyData);
          break;

        case "subtask":
          // Subtask is a UserStory with a parent
          // Find parent story to get feature_id
          const parentStory = await UserStory.findByPk(req.body.parent_id);

          if (!parentStory) {
            return ResponseService.apiResponse({
              res,
              success: false,
              status: 404,
              message: "Parent story not found",
              ...thisAction,
            });
          }

          const subtaskData = {
            title: req.body.title,
            description: req.body.description,
            project_id: parentStory.project_id, // Use parent's project
            department_id: parentStory.department_id, // Use parent's dept
            feature_id: parentStory.feature_id, // Use parent's feature
            type: "task", // Implementation detail: stored as task
            parent_user_story_id: req.body.parent_id, // Vital for subtask
            priority: req.body.priority || "medium",
            assignee: req.body.assignee,
            reporter_id: req.user ? req.user.id : null,
          };
          const subtaskReq = { ...req, body: subtaskData };
          result = await UserStoryService.createUserStory(
            subtaskReq,
            subtaskData,
          );
          break;

        case "bug":
          // Map to Issue
          // IssueService expects title, description, project_id, from_dept, to_dept, issue_type_id
          const issueData = {
            title: req.body.title,
            description: req.body.description,
            project_id: req.body.project_id,
            from_department_id: req.body.department_id, // Assuming same dept for simplification
            to_department_id: req.body.department_id,
            issue_type_id: req.body.issue_type_id, // Needs to be looked up or provided
            user_story_id: req.body.parent_id, // Link to story if provided
            priority: req.body.priority || "medium",
          };

          // Bug handling requires issue_type_id. If not provided, we might need a default 'Bug' type.
          if (!issueData.issue_type_id) {
            const bugType = await IssueType.findOne({ where: { name: "Bug" } });
            if (bugType) issueData.issue_type_id = bugType.id;
          }

          const issueReq = { ...req, body: issueData };
          result = await IssueService.createIssue(issueReq, issueData);
          break;

        default:
          return ResponseService.apiResponse({
            res,
            success: false,
            message:
              "Invalid work item type. Allowed: Epic, Story, Task, Subtask, Bug",
            ...thisAction,
          });
      }

      return ResponseService.apiResponse({ res, ...result, ...thisAction });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }

  // List all work items for a project
  static async getProjectWorkItems(req, res) {
    const thisAction = { usedFor: "WorkItems", action: "list" };
    try {
      const { projectId } = req.params;
      const { Feature, UserStory, Issue, IssueType } = req.db;

      // Parallel fetching
      const [features, stories, issues] = await Promise.all([
        Feature.findAll({ where: { project_id: projectId } }),
        UserStory.findAll({ where: { project_id: projectId } }),
        Issue.findAll({
          where: { project_id: projectId },
          include: [{ model: IssueType, as: "type" }],
        }),
      ]);

      // Normalize results
      const normalized = [
        ...features.map((f) => ({
          id: f.id,
          type: "Epic",
          title: f.name,
          description: f.description,
          status: f.status,
          created_at: f.created_at,
          // Custom fields
          department_id: f.department_id,
          parent_id: f.parent_feature_id,
        })),
        ...stories.map((s) => ({
          id: s.id,
          type: s.parent_user_story_id
            ? "Subtask"
            : s.type === "story"
              ? "Story"
              : "Task",
          title: s.title,
          description: s.description,
          status: s.status,
          priority: s.priority,
          assignee: s.assigned_to,
          created_at: s.createdAt, // UserStory timestamps are camelCase in default sequelize but strict underscored in definition... checking...
          // ...commonFields() adds created_at usually.
          // Custom fields
          department_id: s.department_id,
          parent_id: s.parent_user_story_id || s.feature_id,
        })),
        ...issues.map((i) => ({
          id: i.id,
          type: "Bug",
          title: i.title,
          description: i.description,
          status: i.status,
          priority: i.priority,
          issue_type: i.type?.name,
          created_at: i.created_at,
          // Custom fields
          department_id: i.to_department_id,
          parent_id: i.user_story_id,
        })),
      ];

      return ResponseService.apiResponse({
        res,
        success: true,
        data: normalized,
        ...thisAction,
      });
    } catch (err) {
      return sendErrorResponse(thisAction, err, res);
    }
  }
}

module.exports = UnifiedIssueController;
