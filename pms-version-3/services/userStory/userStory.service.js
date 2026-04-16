// Author: Gururaj
// Created: 14th Oct 2025
// Description: User Story service for lifecycle management: create, update, timer, helper stories, dependencies, and change requests.
// Version: 2.0.0
// Modified:

// Description: User Story service - business logic for user stories (Stories, Tasks)
// Hierarchy: Feature → User Stories → Sub User Stories/Tasks
// Version: 2.1.0 - Enhanced for Jira-like compliance

const {
  withContext,
  paginateHelperFunction,
  auditLogCreateHelperFunction,
  auditLogUpdateHelperFunction,
  auditLogDeleteHelperFunction,
  giveValicationErrorFormal,
} = require("../../util/helper");
const { createNotification } = require("../notification/notification.service");
const { Op, Sequelize } = require("sequelize");

class UserStoryService {
  /**
   * Create a user story or task under a feature
   */
  async createUserStory(req, data) {
    const { UserStory, Feature, Project } = req.db;
    try {
      // Validate feature exists and belongs to project
      const feature = await Feature.findByPk(data.feature_id);
      if (!feature) {
        return { success: false, status: 404, message: "Feature not found" };
      }

      // If parent_user_story_id is given, validate it exists and belongs to same feature
      if (data.parent_user_story_id) {
        const parent = await UserStory.findByPk(data.parent_user_story_id);
        if (!parent) {
          return {
            success: false,
            status: 404,
            message: "Parent user story not found",
          };
        }
        if (parent.feature_id !== data.feature_id) {
          return {
            success: false,
            status: 400,
            message: "Parent user story must belong to the same feature",
          };
        }
      }

      // Set project_id from feature if not provided
      if (!data.project_id) {
        data.project_id = feature.project_id;
      }

      // Set reporter_id from authenticated user
      if (req.user && req.user.id) {
        data.reporter_id = req.user.id;
      }

      // Default type to story if not provided
      if (!data.type) {
        data.type = "story";
      }

      const userStory = await auditLogCreateHelperFunction({
        model: UserStory,
        data,
        req,
      });

      // Notify project members
      const project = await Project.findByPk(data.project_id);
      if (project) {
        try {
          await createNotification(req, {
            scope: "project_department",
            title: `New ${data.type} in ${project.name}`,
            message: `${data.type === "story" ? "User Story" : "Task"} "${data.title}" has been created`,
            triggeredById: req?.user?.id,
            projectId: project.id,
            departmentId: data.department_id,
            entityType: "user_story",
            entityId: userStory.id,
          });

          // If assigned immediately, notify assignee
          if (data.assigned_to && data.assigned_to !== req?.user?.id) {
            await createNotification(req, {
              scope: "user",
              title: `Assigned to you: ${data.title}`,
              message: `You have been assigned to ${data.type} "${data.title}"`,
              triggeredById: req?.user?.id,
              targetUserId: data.assigned_to,
              entityType: "user_story",
              entityId: userStory.id,
            });
          }
        } catch (notifErr) {
          // Notification failure must not roll back the user story creation
          console.error(
            "Notification error (non-fatal):",
            notifErr?.message || notifErr,
          );
        }
      }

      // Recalculate parent story status after a new sub-item is added
      if (data.parent_user_story_id) {
        try {
          await this._recalculateParentStatus(req, data.parent_user_story_id);
        } catch (autoRevertErr) {
          console.error(
            "Parent status recalc error (non-fatal):",
            autoRevertErr?.message,
          );
        }
      }

      return { success: true, status: 201, data: userStory };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return {
          success: false,
          status: 422,
          message: "Validation Error",
          errors: giveValicationErrorFormal(err),
        };
      }
      throw err;
    }
  }

  /**
   * Get a single user story with sub-stories and tasks
   */
  async getUserStory(req, userStoryId) {
    const { UserStory } = req.db;

    const userStory = await UserStory.findByPk(userStoryId, {
      include: [
        {
          association: "subStories",
          order: [["sort_order", "ASC"]],
        },
        { association: "issues" },
        {
          association: "feature",
          attributes: ["id", "name", "project_id", "department_id"],
        },
        { association: "parentStory", attributes: ["id", "title"] },
      ],
    });

    if (!userStory) {
      return { success: false, status: 404, message: "User story not found" };
    }

    return { success: true, status: 200, data: userStory };
  }

  // ─── Internal Helper ───────────────────────────────────────────────────────

  /**
   * Check whether the requesting user is a team lead in the given project.
   */
  async _isTeamLead(req, projectId) {
    const { ProjectMember } = req.db;
    const userId = req.user?.id;
    if (!userId || !projectId) return false;
    const member = await ProjectMember.findOne({
      where: { project_id: projectId, user_id: userId, project_role: "lead" },
    });
    return !!member;
  }

  /**
   * Recalculate and persist the status of a parent story based on its sub-items.
   *
   * Rules:
   *   - No sub-items           → no change
   *   - ALL sub-items completed → parent = "completed"
   *   - ALL sub-items defined   → parent = "defined"
   *   - Mixed / any in-flight  → parent = "in_progress"
   */
  async _recalculateParentStatus(req, parentId) {
    if (!parentId) return;
    const { UserStory, IssueStatus } = req.db;

    const parent = await UserStory.findByPk(parentId);
    if (!parent) return;

    const subs = await UserStory.findAll({
      where: { parent_user_story_id: parentId },
      attributes: ["status"],
    });

    if (subs.length === 0) return; // no sub-items: parent keeps its manual status

    const statuses = subs.map((s) => s.status);
    let newStatus;

    if (statuses.every((s) => s === "completed")) {
      newStatus = "completed";
    } else if (statuses.every((s) => s === "defined")) {
      newStatus = "defined";
    } else {
      newStatus = "in_progress";
    }

    if (parent.status === newStatus) return; // nothing to do

    const updateData = { status: newStatus };
    if (newStatus === "completed") {
      updateData.completed_at = new Date();
      // Also move parent to the "Done" column on the board
      let doneStatus = await IssueStatus.findOne({
        where: { category: "done", project_id: parent.project_id },
        order: [["position", "ASC"]],
      });
      if (!doneStatus) {
        doneStatus = await IssueStatus.findOne({
          where: { category: "done", project_id: null },
          order: [["position", "ASC"]],
        });
      }
      if (doneStatus) updateData.status_id = doneStatus.id;
      // Auto-stop the timer if it is running
      if (parent.live_status === "running") {
        const elapsed = parent.taken_at
          ? Math.floor(
              (Date.now() - new Date(parent.taken_at).getTime()) / 60000,
            )
          : 0;
        updateData.live_status = "stop";
        updateData.taken_at = null;
        updateData.total_work_time = (parent.total_work_time || 0) + elapsed;
      }
    } else if (parent.status === "completed") {
      updateData.completed_at = null; // reset if moving away from completed
    }

    await parent.update(updateData, { ...withContext(req) });
  }

  /**
   * Notify all team leads of a project about a change request.
   */
  async _notifyLeads(
    req,
    projectId,
    departmentId,
    story,
    requestType,
    requestedValue,
  ) {
    const { ProjectMember } = req.db;
    try {
      const leads = await ProjectMember.findAll({
        where: { project_id: projectId, project_role: "lead" },
      });
      for (const lead of leads) {
        await createNotification(req, {
          scope: "user",
          title: "Change Request Needs Approval",
          message: `"${story.title}" — ${requestType === "due_date_change" ? `due date change to ${requestedValue.due_date}` : `status revert to ${requestedValue.target_status}`}. Please review.`,
          triggeredById: req?.user?.id,
          targetUserId: lead.user_id,
          projectId,
          departmentId,
          entityType: "user_story",
          entityId: story.id,
        });
      }
    } catch (notifErr) {
      console.error(
        "Notify leads error (non-fatal):",
        notifErr?.message || notifErr,
      );
    }
  }

  /**
   * Update a user story — enforces due date lock for non-leads.
   * Status changes via this endpoint are blocked; use advanceStatus instead.
   */
  async updateUserStory(req, userStoryId, data) {
    const { UserStory } = req.db;
    try {
      const userStory = await UserStory.findByPk(userStoryId);
      if (!userStory) {
        return { success: false, status: 404, message: "User story not found" };
      }

      // ── Due date lock: only team leads can change an existing due date ──────
      if (
        data.due_date !== undefined &&
        userStory.due_date &&
        data.due_date !== userStory.due_date
      ) {
        const projectId = userStory.project_id || userStory.feature?.project_id;
        const isLead = await this._isTeamLead(req, projectId);
        if (!isLead) {
          return {
            success: false,
            status: 403,
            code: "DUE_DATE_LOCKED",
            message:
              "Due date is locked. Submit a change request for team-lead approval.",
          };
        }
      }

      // ── Block direct status manipulation — use advanceStatus / requestChange ─
      if (data.status !== undefined) {
        const projectId = userStory.project_id || userStory.feature?.project_id;
        const isLead = await this._isTeamLead(req, projectId);

        const STATUS_ORDER = ["defined", "in_progress", "review", "completed"];
        const currentIdx = STATUS_ORDER.indexOf(userStory.status);
        const newIdx = STATUS_ORDER.indexOf(data.status);

        if (!isLead) {
          if (newIdx >= 0 && currentIdx >= 0 && newIdx < currentIdx) {
            // Backward — requires lead approval
            return {
              success: false,
              status: 403,
              code: "STATUS_REVERT_BLOCKED",
              message:
                "Cannot revert status. Submit a change request for team-lead approval.",
            };
          }
          if (newIdx > currentIdx + 1) {
            // Skipping steps is not allowed
            return {
              success: false,
              status: 400,
              message:
                "Status can only advance one step at a time. Use the Advance Status button.",
            };
          }
        }

        // review -> completed requires existing approval
        if (userStory.status === "review" && data.status === "completed") {
          if (
            userStory.approval_status !== "approved" &&
            userStory.approval_status !== "not_required" &&
            data.approval_status !== "approved"
          ) {
            return {
              success: false,
              status: 400,
              message:
                "Cannot complete item without approval. Please approve first.",
            };
          }
        }

        if (data.status === "completed" && userStory.status !== "completed") {
          data.completed_at = new Date();
        }
      }

      // Detect assignment change
      const newAssignee =
        data.assigned_to !== undefined &&
        data.assigned_to !== userStory.assigned_to;

      const updated = await auditLogUpdateHelperFunction({
        model: userStory,
        data,
        req,
      });

      // Notification Logic
      if (newAssignee && data.assigned_to) {
        await createNotification(req, {
          scope: "user",
          title: `Assigned to you: ${updated.title}`,
          message: `You have been assigned to ${updated.type} "${updated.title}"`,
          triggeredById: req?.user?.id,
          targetUserId: data.assigned_to,
          entityType: "user_story",
          entityId: updated.id,
        });
      }

      return { success: true, status: 200, data: updated };
    } catch (err) {
      if (err instanceof Sequelize.UniqueConstraintError) {
        return {
          success: false,
          status: 422,
          message: "Validation Error",
          errors: giveValicationErrorFormal(err),
        };
      }
      throw err;
    }
  }

  // ─── Status Flow: defined → in_progress → review → completed ────────────

  /**
   * Advance a story to the next state in the linear flow.
   * Enforces: only one in_progress story per user at a time.
   */
  async advanceStatus(req, userStoryId) {
    const { UserStory } = req.db;
    const STATUS_ORDER = ["defined", "in_progress", "review", "completed"];

    const userStory = await UserStory.findByPk(userStoryId);
    if (!userStory) {
      return { success: false, status: 404, message: "User story not found" };
    }

    const currentIdx = STATUS_ORDER.indexOf(userStory.status);
    if (currentIdx === -1) {
      return {
        success: false,
        status: 400,
        message: `Cannot advance from status "${userStory.status}". Please resolve it first.`,
      };
    }
    if (currentIdx >= STATUS_ORDER.length - 1) {
      return {
        success: false,
        status: 400,
        message: "Story is already completed.",
      };
    }

    const nextStatus = STATUS_ORDER[currentIdx + 1];
    const assignedUserId = userStory.assigned_to || req.user?.id;

    // ── Single active story rule (top-level stories only) ──────────────────
    // Sub-stories are exempt — they are sub-tasks and can run in parallel.
    const isSubStory = !!userStory.parent_user_story_id;
    if (nextStatus === "in_progress" && assignedUserId && !isSubStory) {
      const otherInProgress = await UserStory.findOne({
        where: {
          id: { [Op.ne]: userStoryId },
          assigned_to: assignedUserId,
          status: "in_progress",
          story_for: "normal",
          parent_user_story_id: null, // only top-level stories count
        },
      });

      if (otherInProgress) {
        // Auto-stop the timer on the other in-progress story
        if (otherInProgress.live_status === "running") {
          const elapsed = otherInProgress.taken_at
            ? Math.floor(
                (Date.now() - new Date(otherInProgress.taken_at).getTime()) /
                  60000,
              )
            : 0;
          await otherInProgress.update(
            {
              live_status: "stop",
              taken_at: null,
              total_work_time: (otherInProgress.total_work_time || 0) + elapsed,
            },
            { ...withContext(req) },
          );
        }

        // Notify about the conflict
        try {
          await createNotification(req, {
            scope: "user",
            title: "Story paused — another started",
            message: `Timer stopped on "${otherInProgress.title}" because you started "${userStory.title}".`,
            triggeredById: null,
            targetUserId: assignedUserId,
            entityType: "user_story",
            entityId: otherInProgress.id,
          });
        } catch (e) {
          /* non-fatal */
        }

        return {
          success: false,
          status: 409,
          code: "ANOTHER_IN_PROGRESS",
          conflict_story: {
            id: otherInProgress.id,
            title: otherInProgress.title,
            status: otherInProgress.status,
          },
          message: `You already have "${otherInProgress.title}" in progress. Its timer has been stopped. Move it to review before starting another story.`,
        };
      }
    }

    // ── Advance ────────────────────────────────────────────────────────────
    const updateData = { status: nextStatus };

    if (nextStatus === "in_progress") {
      updateData.taken_at = new Date();
    }
    if (nextStatus === "review") {
      updateData.approval_status = "pending";
    }
    if (nextStatus === "completed") {
      updateData.completed_at = new Date();
      updateData.approval_status = "not_required";
    }

    await userStory.update(updateData, { ...withContext(req) });

    // Notify team leads on review
    if (nextStatus === "review") {
      const projectId = userStory.project_id;
      await this._notifyLeads(
        req,
        projectId,
        userStory.department_id,
        userStory,
        "review",
        {},
      );
    }

    // Auto-recalculate parent status based on all its sub-items
    try {
      await this._recalculateParentStatus(req, userStory.parent_user_story_id);
    } catch (e) {
      /* non-fatal */
    }

    return {
      success: true,
      status: 200,
      data: userStory,
      message: `Status advanced to ${nextStatus}`,
    };
  }

  // ─── Change Requests ───────────────────────────────────────────────────────

  /**
   * Revert a story one step back in the status order.
   * Allowed freely unless the story is already "completed" — in that case
   * the caller must submit a change request for team-lead approval.
   */
  async revertStatus(req, userStoryId) {
    const { UserStory } = req.db;
    const STATUS_ORDER = ["defined", "in_progress", "review", "completed"];

    const userStory = await UserStory.findByPk(userStoryId);
    if (!userStory) {
      return { success: false, status: 404, message: "User story not found" };
    }

    const currentIdx = STATUS_ORDER.indexOf(userStory.status);
    if (currentIdx <= 0) {
      return {
        success: false,
        status: 400,
        message: "Story is already at the initial status.",
      };
    }

    const prevStatus = STATUS_ORDER[currentIdx - 1];
    const revertData = { status: prevStatus };
    if (userStory.status === "completed") revertData.completed_at = null;
    await userStory.update(revertData, { ...withContext(req) });

    // Auto-recalculate parent status based on all its sub-items
    try {
      await this._recalculateParentStatus(req, userStory.parent_user_story_id);
    } catch (e) {
      /* non-fatal */
    }

    return {
      success: true,
      status: 200,
      data: userStory,
      message: `Status reverted to ${prevStatus}`,
    };
  }

  /**
   * Submit a change request (due date change or status revert).
   * Called by team members who cannot make the change themselves.
   */
  async requestChange(
    req,
    userStoryId,
    { request_type, requested_value, reason },
  ) {
    const { UserStory, StoryChangeRequest } = req.db;

    const userStory = await UserStory.findByPk(userStoryId);
    if (!userStory) {
      return { success: false, status: 404, message: "User story not found" };
    }

    if (!["due_date_change", "status_revert"].includes(request_type)) {
      return { success: false, status: 400, message: "Invalid request_type" };
    }

    // Build current_value snapshot
    let current_value = {};
    if (request_type === "due_date_change") {
      current_value = { due_date: userStory.due_date };
      if (!requested_value?.due_date) {
        return {
          success: false,
          status: 400,
          message: "requested_value.due_date is required",
        };
      }
    } else {
      current_value = { current_status: userStory.status };
      if (!requested_value?.target_status) {
        return {
          success: false,
          status: 400,
          message: "requested_value.target_status is required",
        };
      }
    }

    // Check for an existing pending request of the same type
    const existing = await StoryChangeRequest.findOne({
      where: { story_id: userStoryId, request_type, status: "pending" },
    });
    if (existing) {
      return {
        success: false,
        status: 409,
        message:
          "A pending change request of this type already exists for this story.",
      };
    }

    const changeRequest = await StoryChangeRequest.create(
      {
        story_id: userStoryId,
        requested_by: req.user?.id,
        request_type,
        requested_value,
        current_value,
        status: "pending",
        review_comments: reason || null,
      },
      { ...withContext(req) },
    );

    // Notify team leads
    const projectId = userStory.project_id;
    await this._notifyLeads(
      req,
      projectId,
      userStory.department_id,
      userStory,
      request_type,
      requested_value,
    );

    return {
      success: true,
      status: 201,
      data: changeRequest,
      message: "Change request submitted. Awaiting team lead approval.",
    };
  }

  /**
   * Team lead approves or rejects a change request.
   * On approval the requested change is applied immediately.
   */
  async reviewChangeRequest(req, requestId, { action, comments }) {
    const { UserStory, StoryChangeRequest } = req.db;

    if (!["approved", "rejected"].includes(action)) {
      return {
        success: false,
        status: 400,
        message: "action must be 'approved' or 'rejected'",
      };
    }

    const changeRequest = await StoryChangeRequest.findByPk(requestId, {
      include: [{ association: "story" }],
    });
    if (!changeRequest) {
      return {
        success: false,
        status: 404,
        message: "Change request not found",
      };
    }
    if (changeRequest.status !== "pending") {
      return {
        success: false,
        status: 400,
        message: `Change request is already ${changeRequest.status}`,
      };
    }

    const story = changeRequest.story;
    if (!story) {
      return {
        success: false,
        status: 404,
        message: "Associated story not found",
      };
    }

    // Verify requester is a lead
    const isLead = await this._isTeamLead(req, story.project_id);
    if (!isLead) {
      return {
        success: false,
        status: 403,
        message: "Only team leads can review change requests",
      };
    }

    await changeRequest.update(
      {
        status: action,
        reviewed_by: req.user?.id,
        reviewed_at: new Date(),
        review_comments: comments || changeRequest.review_comments,
      },
      { ...withContext(req) },
    );

    // Apply the change if approved
    if (action === "approved") {
      if (changeRequest.request_type === "due_date_change") {
        await story.update(
          { due_date: changeRequest.requested_value.due_date },
          { ...withContext(req) },
        );
      } else if (changeRequest.request_type === "status_revert") {
        const targetStatus = changeRequest.requested_value.target_status;
        const updateData = { status: targetStatus };
        if (targetStatus === "completed") updateData.completed_at = new Date();
        await story.update(updateData, { ...withContext(req) });
      }
    }

    // Notify the requester
    try {
      await createNotification(req, {
        scope: "user",
        title: `Change Request ${action === "approved" ? "Approved" : "Rejected"}`,
        message: `Your change request for "${story.title}" was ${action}${comments ? `: ${comments}` : "."}`,
        triggeredById: req?.user?.id,
        targetUserId: changeRequest.requested_by,
        entityType: "user_story",
        entityId: story.id,
      });
    } catch (e) {
      /* non-fatal */
    }

    return {
      success: true,
      status: 200,
      data: changeRequest,
      message: `Change request ${action}`,
    };
  }

  /**
   * Get all change requests for a story.
   */
  async getChangeRequests(req, userStoryId) {
    const { StoryChangeRequest, UserStory } = req.db;
    const story = await UserStory.findByPk(userStoryId);
    if (!story)
      return { success: false, status: 404, message: "User story not found" };

    const requests = await StoryChangeRequest.findAll({
      where: { story_id: userStoryId },
      order: [["created_at", "DESC"]],
    });
    return { success: true, status: 200, data: requests };
  }

  /**
   * Get all pending change requests across projects where the user is a team lead.
   */
  async getPendingChangeRequests(req) {
    const { StoryChangeRequest, ProjectMember, UserStory } = req.db;
    const userId = req.user?.id;

    // Get projects where this user is lead
    const leadMemberships = await ProjectMember.findAll({
      where: { user_id: userId, project_role: "lead" },
      attributes: ["project_id"],
    });
    const projectIds = leadMemberships.map((m) => m.project_id);

    if (projectIds.length === 0) {
      return { success: true, status: 200, data: [] };
    }

    const requests = await StoryChangeRequest.findAll({
      where: { status: "pending" },
      include: [
        {
          association: "story",
          required: true,
          where: { project_id: { [Op.in]: projectIds } },
          attributes: ["id", "title", "status", "due_date", "project_id"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    return { success: true, status: 200, data: requests };
  }

  /**
   * Approve a user story (Jira Workflow: Review -> Done)
   */
  async approveUserStory(req, userStoryId, { status, comments }) {
    const { UserStory } = req.db;
    const userStory = await UserStory.findByPk(userStoryId);
    if (!userStory) {
      return { success: false, status: 404, message: "User story not found" };
    }

    if (status === "approved") {
      userStory.approval_status = "approved";
      userStory.approved_by = req.user?.id;
      userStory.status = "completed"; // Auto-complete on approval
      userStory.completed_at = new Date();
    } else if (status === "rejected") {
      userStory.approval_status = "rejected";
      userStory.status = "in_progress"; // Send back to progress
    } else {
      return {
        success: false,
        status: 400,
        message: "Invalid approval status",
      };
    }

    await userStory.save({ ...withContext(req) });

    // Notify assignee of approval/rejection
    if (userStory.assigned_to) {
      await createNotification(req, {
        scope: "user",
        title: `User Story ${status === "approved" ? "Approved" : "Rejected"}`,
        message: `Your user story "${userStory.title}" was ${status}`,
        triggeredById: req?.user?.id,
        targetUserId: userStory.assigned_to,
        entityType: "user_story",
        entityId: userStory.id,
      });
    }

    return { success: true, status: 200, data: userStory };
  }

  /**
   * Delete a user story (and cascade to sub-stories)
   */
  async deleteUserStory(req, userStoryId) {
    const { UserStory } = req.db;

    const userStory = await UserStory.findByPk(userStoryId);
    if (!userStory) {
      return { success: false, status: 404, message: "User story not found" };
    }

    const parentId = userStory.parent_user_story_id;
    await auditLogDeleteHelperFunction({ model: userStory, req });

    // Recalculate parent status now that this sub-item is gone
    try {
      await this._recalculateParentStatus(req, parentId);
    } catch (e) {
      /* non-fatal */
    }

    return {
      success: true,
      status: 200,
      message: "User story deleted successfully",
    };
  }

  /**
   * Get all user stories for a feature (top-level + nested sub-stories)
   */
  async getUserStoriesByFeature(req, { feature_id, query = {} }) {
    const { UserStory, Feature } = req.db;

    const feature = await Feature.findByPk(feature_id);
    if (!feature) {
      return { success: false, status: 404, message: "Feature not found" };
    }

    const whereFilters = {
      feature_id,
      parent_user_story_id: null, // Only top-level stories
    };

    const extrasInQuery = {
      include: [
        {
          association: "subStories",
          include: [{ association: "subStories" }], // 2 levels deep
          order: [["sort_order", "ASC"]],
        },
      ],
      distinct: true,
    };

    const result = await paginateHelperFunction({
      model: UserStory,
      whereFilters,
      query,
      extrasInQuery,
    });

    return { success: true, status: 200, data: result };
  }

  /**
   * Get all user stories for a project (flat list with pagination)
   */
  async getUserStoriesByProject(req, { project_id, query = {} }) {
    const { UserStory, Project } = req.db;

    const project = await Project.findByPk(project_id);
    if (!project) {
      return { success: false, status: 404, message: "Project not found" };
    }

    const whereFilters = { project_id };

    const extrasInQuery = {
      include: [
        { association: "feature", attributes: ["id", "name"] },
        { association: "parentStory", attributes: ["id", "title"] },
      ],
      distinct: true,
    };

    const result = await paginateHelperFunction({
      model: UserStory,
      whereFilters,
      query,
      extrasInQuery,
    });

    return { success: true, status: 200, data: result };
  }

  /**
   * Get all user stories for a project by department
   */
  async getUserStoriesByProjectDepartment(
    req,
    { project_id, department_id, query = {} },
  ) {
    const { UserStory } = req.db;

    const whereFilters = { project_id, department_id };

    const extrasInQuery = {
      include: [
        { association: "feature", attributes: ["id", "name"] },
        { association: "parentStory", attributes: ["id", "title"] },
      ],
      distinct: true,
    };

    const result = await paginateHelperFunction({
      model: UserStory,
      whereFilters,
      query,
      extrasInQuery,
    });

    return { success: true, status: 200, data: result };
  }

  /**
   * Calculate completion percentage for a feature/project
   * Based on how many user stories/tasks are completed vs total defined
   */
  async getCompletionStats(req, { project_id, feature_id = null }) {
    const { UserStory } = req.db;

    const whereFilters = { project_id };
    if (feature_id) {
      whereFilters.feature_id = feature_id;
    }

    const total = await UserStory.count({ where: whereFilters });
    const completed = await UserStory.count({
      where: { ...whereFilters, status: "completed" },
    });

    const completionPercentage =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    // Breakdown by status and type
    const statusBreakdown = await UserStory.findAll({
      where: whereFilters,
      attributes: [
        "status",
        "type",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      group: ["status", "type"],
      raw: true,
    });

    return {
      success: true,
      status: 200,
      data: {
        total,
        completed,
        completion_percentage: completionPercentage,
        status_breakdown: statusBreakdown,
      },
    };
  }

  /**
   * Reorder user stories within a parent/feature
   */
  async reorderUserStories(req, updates) {
    const { UserStory } = req.db;
    const sequelize = req.sequelize;

    await sequelize.transaction(async (t) => {
      for (const { id, sort_order } of updates) {
        await UserStory.update(
          { sort_order },
          {
            where: { id },
            ...withContext(req),
            transaction: t,
          },
        );
      }
    });

    return {
      success: true,
      status: 200,
      message: "User stories reordered successfully",
    };
  }

  /**
   * Start timer on a user story / task.
   * Also closes any open WorkLog sessions for this user and opens a new one.
   */
  async startTimer(req, userStoryId) {
    const { UserStory, WorkLog } = req.db;
    const userStory = await UserStory.findByPk(userStoryId);
    if (!userStory) {
      return { success: false, status: 404, message: "User story not found" };
    }
    if (userStory.live_status === "running") {
      return {
        success: false,
        status: 400,
        message: "Timer is already running",
      };
    }

    if (userStory.status === "completed") {
      return {
        success: false,
        status: 400,
        code: "STORY_COMPLETED",
        message: "Cannot start timer on a completed story.",
      };
    }

    const now = new Date();

    // Close any open WorkLog sessions belonging to this user before starting a new one
    if (WorkLog && req.user?.id) {
      try {
        const openLogs = await WorkLog.findAll({
          where: { user_id: req.user.id, end_time: null },
        });
        for (const log of openLogs) {
          const duration = Math.round(
            (now.getTime() - new Date(log.start_time).getTime()) / 60000,
          );
          await log.update(
            { end_time: now, duration_minutes: Math.max(duration, 0) },
            { ...withContext(req) },
          );
        }
      } catch (wlErr) {
        console.error(
          "WorkLog close-existing error (non-fatal):",
          wlErr?.message || wlErr,
        );
      }
    }

    // Stop any other running timers for this user
    await UserStory.update(
      { live_status: "stop" },
      {
        where: { live_status: "running", assigned_to: req.user?.id },
        ...withContext(req),
      },
    );

    userStory.live_status = "running";
    userStory.taken_at = now;
    if (userStory.status === "defined") {
      userStory.status = "in_progress";
    }
    await userStory.save({ ...withContext(req) });

    // Open a new WorkLog session for this user story
    if (WorkLog && req.user?.id) {
      try {
        await WorkLog.create(
          {
            user_id: req.user.id,
            user_story_id: userStory.id,
            project_id: userStory.project_id,
            feature_id: userStory.feature_id,
            department_id: userStory.department_id,
            sprint_id: userStory.sprint_id || null,
            start_time: now,
            log_date: now.toISOString().slice(0, 10),
          },
          { ...withContext(req) },
        );
      } catch (wlErr) {
        console.error(
          "WorkLog create error (non-fatal):",
          wlErr?.message || wlErr,
        );
      }
    }

    return {
      success: true,
      status: 200,
      data: userStory,
      message: "Timer started",
    };
  }

  /**
   * Stop timer on a user story / task.
   * Closes the open WorkLog session and computes the duration.
   */
  async stopTimer(req, userStoryId) {
    const { UserStory, WorkLog } = req.db;
    const userStory = await UserStory.findByPk(userStoryId);
    if (!userStory) {
      return { success: false, status: 404, message: "User story not found" };
    }
    if (userStory.live_status !== "running") {
      return { success: false, status: 400, message: "Timer is not running" };
    }

    const now = new Date();
    const startedAt = new Date(userStory.taken_at);
    const workedMinutes = Math.round((now - startedAt) / 60000);

    userStory.total_work_time =
      (userStory.total_work_time || 0) + workedMinutes;
    userStory.live_status = "stop";
    userStory.taken_at = null;
    await userStory.save({ ...withContext(req) });

    // Close the open WorkLog session for this story
    if (WorkLog && req.user?.id) {
      try {
        const openLog = await WorkLog.findOne({
          where: {
            user_story_id: userStory.id,
            user_id: req.user.id,
            end_time: null,
          },
          order: [["start_time", "DESC"]],
        });
        if (openLog) {
          await openLog.update(
            { end_time: now, duration_minutes: Math.max(workedMinutes, 0) },
            { ...withContext(req) },
          );
        }
      } catch (wlErr) {
        console.error(
          "WorkLog update error (non-fatal):",
          wlErr?.message || wlErr,
        );
      }
    }

    return {
      success: true,
      status: 200,
      data: userStory,
      message: "Timer stopped",
    };
  }

  /**
   * Get the currently running timer for the current user
   */
  async getCurrentTimer(req) {
    const { UserStory } = req.db;
    const running = await UserStory.findOne({
      where: { live_status: "running", assigned_to: req.user?.id },
      include: [{ association: "feature", attributes: ["id", "name"] }],
    });
    return { success: true, status: 200, data: running };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helper Stories
  // A helper story is a user story created to assist another story.
  // Workflow: create (status=accept_pending) → assignee accepts/rejects
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Create a helper story to assist a parent story.
   * The helper's assigned_to must differ from the parent's assigned_to.
   */
  async createHelperStory(req, parentUserStoryId, data) {
    const { UserStory, Feature } = req.db;

    const parentStory = await UserStory.findByPk(parentUserStoryId);
    if (!parentStory) {
      return {
        success: false,
        status: 404,
        message: "Parent user story not found",
      };
    }

    if (parentStory.status === "completed") {
      return {
        success: false,
        status: 400,
        message: "Cannot create a helper for a completed story",
      };
    }

    // The helper assignee must be different from the parent's assignee
    if (data.assigned_to && data.assigned_to === parentStory.assigned_to) {
      return {
        success: false,
        status: 400,
        message:
          "Helper story must be assigned to a different person than the parent story",
      };
    }

    const feature = await Feature.findByPk(parentStory.feature_id);
    if (!feature) {
      return {
        success: false,
        status: 404,
        message: "Feature not found for parent story",
      };
    }

    const helperData = {
      ...data,
      feature_id: parentStory.feature_id,
      project_id: parentStory.project_id,
      department_id: data.department_id || parentStory.department_id,
      parent_user_story_id: null, // helpers are top-level, linked via helped_for
      story_for: "help",
      helped_for: parentUserStoryId,
      status: "accept_pending",
      reporter_id: req.user?.id,
      type: "story",
    };

    const helperStory = await auditLogCreateHelperFunction({
      model: UserStory,
      data: helperData,
      req,
    });

    // Notify the helper assignee (if provided)
    if (data.assigned_to) {
      try {
        await createNotification(req, {
          scope: "user",
          title: `Help requested: "${parentStory.title}"`,
          message: `You have been asked to help with story "${parentStory.title}". Please accept or reject.`,
          triggeredById: req?.user?.id,
          targetUserId: data.assigned_to,
          entityType: "user_story",
          entityId: helperStory.id,
        });
      } catch (notifErr) {
        console.error(
          "Notification error (non-fatal):",
          notifErr?.message || notifErr,
        );
      }
    }

    return { success: true, status: 201, data: helperStory };
  }

  /**
   * Accept or reject a helper story request.
   * Only the assigned_to user may accept/reject their own pending helper story.
   * @param {string} action - "accept" | "reject"
   */
  async acceptOrRejectHelperStory(req, helperStoryId, action) {
    const { UserStory } = req.db;

    if (!["accept", "reject"].includes(action)) {
      return {
        success: false,
        status: 400,
        message: "Action must be 'accept' or 'reject'",
      };
    }

    const helperStory = await UserStory.findByPk(helperStoryId);
    if (!helperStory) {
      return { success: false, status: 404, message: "Helper story not found" };
    }
    if (helperStory.story_for !== "help") {
      return {
        success: false,
        status: 400,
        message: "This is not a helper story",
      };
    }
    if (helperStory.status !== "accept_pending") {
      return {
        success: false,
        status: 400,
        message: "This helper story is not pending acceptance",
      };
    }
    if (helperStory.assigned_to !== req.user?.id) {
      return {
        success: false,
        status: 403,
        message: "Only the assigned person can accept or reject",
      };
    }

    helperStory.status = action === "accept" ? "in_progress" : "reject";
    await helperStory.save({ ...withContext(req) });

    // Notify the reporter of the decision
    if (helperStory.reporter_id && helperStory.reporter_id !== req.user?.id) {
      try {
        const parentStory = await UserStory.findByPk(helperStory.helped_for);
        await createNotification(req, {
          scope: "user",
          title: `Help request ${action === "accept" ? "accepted" : "rejected"}`,
          message: `Your help request${parentStory ? ` for "${parentStory.title}"` : ""} was ${action === "accept" ? "accepted" : "rejected"}.`,
          triggeredById: req?.user?.id,
          targetUserId: helperStory.reporter_id,
          entityType: "user_story",
          entityId: helperStory.id,
        });
      } catch (notifErr) {
        console.error(
          "Notification error (non-fatal):",
          notifErr?.message || notifErr,
        );
      }
    }

    return {
      success: true,
      status: 200,
      data: helperStory,
      message: `Helper story ${action}ed`,
    };
  }

  /**
   * Get all pending help requests assigned to the current user (across all projects).
   */
  async getHelpRequests(req) {
    const { UserStory } = req.db;
    const requests = await UserStory.findAll({
      where: {
        story_for: "help",
        status: "accept_pending",
        assigned_to: req.user?.id,
      },
      include: [
        {
          association: "helpedStory",
          attributes: ["id", "title", "project_id", "feature_id"],
        },
      ],
    });
    return { success: true, status: 200, data: requests };
  }

  /**
   * Get all helper stories for a given parent user story.
   */
  async getHelperStoriesForStory(req, parentUserStoryId) {
    const { UserStory } = req.db;
    const parentStory = await UserStory.findByPk(parentUserStoryId);
    if (!parentStory) {
      return { success: false, status: 404, message: "User story not found" };
    }
    const helpers = await UserStory.findAll({
      where: { story_for: "help", helped_for: parentUserStoryId },
    });
    return { success: true, status: 200, data: helpers };
  }

  /**
   * Remove (soft-delete) a helper story.
   * Only the reporter or an admin can remove it.
   */
  async removeHelperStory(req, helperStoryId) {
    const { UserStory } = req.db;
    const helperStory = await UserStory.findByPk(helperStoryId);
    if (!helperStory) {
      return { success: false, status: 404, message: "Helper story not found" };
    }
    if (helperStory.story_for !== "help") {
      return {
        success: false,
        status: 400,
        message: "This is not a helper story",
      };
    }

    await auditLogDeleteHelperFunction({
      model: UserStory,
      id: helperStoryId,
      req,
    });
    return { success: true, status: 200, message: "Helper story removed" };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Story Dependencies
  // "Story A depends on Story B" means B must be done before A can proceed.
  // No blocking enforcement — informational / planning only.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Add a dependency: parentStoryId depends on dependencyStoryId.
   */
  async addDependency(req, parentStoryId, dependencyStoryId) {
    const { UserStory, UserStoryDependency } = req.db;

    if (parentStoryId === dependencyStoryId) {
      return {
        success: false,
        status: 400,
        message: "A story cannot depend on itself",
      };
    }

    const [parent, dependency] = await Promise.all([
      UserStory.findByPk(parentStoryId),
      UserStory.findByPk(dependencyStoryId),
    ]);
    if (!parent)
      return { success: false, status: 404, message: "Parent story not found" };
    if (!dependency)
      return {
        success: false,
        status: 404,
        message: "Dependency story not found",
      };

    // Check for duplicate
    const existing = await UserStoryDependency.findOne({
      where: {
        parent_story_id: parentStoryId,
        dependency_story_id: dependencyStoryId,
      },
    });
    if (existing) {
      return {
        success: false,
        status: 409,
        message: "Dependency already exists",
      };
    }

    // Basic circular dependency check: dependencyStoryId should not already depend on parentStoryId
    const circular = await UserStoryDependency.findOne({
      where: {
        parent_story_id: dependencyStoryId,
        dependency_story_id: parentStoryId,
      },
    });
    if (circular) {
      return {
        success: false,
        status: 400,
        message:
          "Circular dependency detected: story B already depends on story A",
      };
    }

    const record = await UserStoryDependency.create({
      parent_story_id: parentStoryId,
      dependency_story_id: dependencyStoryId,
    });

    return {
      success: true,
      status: 201,
      data: record,
      message: "Dependency added",
    };
  }

  /**
   * Remove a dependency relationship.
   */
  async removeDependency(req, parentStoryId, dependencyStoryId) {
    const { UserStoryDependency } = req.db;

    const record = await UserStoryDependency.findOne({
      where: {
        parent_story_id: parentStoryId,
        dependency_story_id: dependencyStoryId,
      },
    });
    if (!record) {
      return { success: false, status: 404, message: "Dependency not found" };
    }

    await record.destroy();
    return { success: true, status: 200, message: "Dependency removed" };
  }

  /**
   * Get all stories that a given story depends on (blockers / prerequisites).
   */
  async getDependencies(req, userStoryId) {
    const { UserStory } = req.db;
    const story = await UserStory.findByPk(userStoryId, {
      include: [
        {
          association: "dependencyStories",
          attributes: [
            "id",
            "title",
            "status",
            "priority",
            "assigned_to",
            "feature_id",
            "project_id",
          ],
        },
      ],
    });
    if (!story)
      return { success: false, status: 404, message: "User story not found" };
    return { success: true, status: 200, data: story.dependencyStories || [] };
  }

  /**
   * Get all stories that depend on this story (stories blocked by this one).
   */
  async getParentStories(req, userStoryId) {
    const { UserStory } = req.db;
    const story = await UserStory.findByPk(userStoryId, {
      include: [
        {
          association: "parentStories",
          attributes: [
            "id",
            "title",
            "status",
            "priority",
            "assigned_to",
            "feature_id",
            "project_id",
          ],
        },
      ],
    });
    if (!story)
      return { success: false, status: 404, message: "User story not found" };
    return { success: true, status: 200, data: story.parentStories || [] };
  }
}

module.exports = new UserStoryService();
