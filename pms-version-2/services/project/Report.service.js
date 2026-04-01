// Author: Copilot
// Created: 18th Mar 2026
// Description: Project Report Service
// Version: 1.1.0

const { Op, Sequelize } = require("sequelize");
const moment = require("moment");

class ReportService {
  /**
   * Get Issue Distribution by Status
   */
  static async getIssueDistribution(req, projectId) {
    const { Issue, IssueStatus } = req.db;

    const distribution = await Issue.findAll({
      where: { project_id: projectId },
      attributes: [
        "status_id",
        [Sequelize.fn("COUNT", Sequelize.col("Issue.id")), "count"],
      ],
      include: [
        {
          model: IssueStatus,
          as: "issueStatus",
          attributes: ["name", "color", "category"],
        },
      ],
      group: ["status_id", "issueStatus.id"],
      raw: true,
    });

    const formatted = distribution.map((d) => ({
      status_id: d.status_id,
      status_name: d["issueStatus.name"] || "Unknown",
      category: d["issueStatus.category"] || "todo",
      color: d["issueStatus.color"] || "#cccccc",
      count: parseInt(d.count, 10),
    }));

    return { success: true, status: 200, data: formatted };
  }

  /**
   * Get Velocity Chart (Last N sprints)
   */
  static async getVelocity(req, projectId, limit = 5) {
    const { Sprint, Issue, IssueStatus, UserStory } = req.db;

    const sprints = await Sprint.findAll({
      where: {
        project_id: projectId,
        status: { [Op.in]: ["active", "completed"] },
      },
      order: [["end_date", "DESC"]], // Recent first
      limit: parseInt(limit),
      include: [
        {
          model: Issue,
          as: "issues",
          include: [
            {
              model: IssueStatus,
              as: "issueStatus",
              attributes: ["category", "name"],
            },
            {
              model: UserStory,
              as: "userStory",
              attributes: ["story_points"],
            },
          ],
        },
      ],
    });

    const sortedSprints = sprints.reverse();

    const data = sortedSprints.map((s) => {
      let committedPoints = 0;
      let completedPoints = 0;

      s.issues.forEach((issue) => {
        const points = issue.userStory?.story_points || 0;
        const effectivePoints = points > 0 ? points : 1;

        committedPoints += effectivePoints;

        if (
          issue.issueStatus &&
          (issue.issueStatus.category === "done" ||
            issue.issueStatus.category === "completed" ||
            ["closed", "resolved"].includes(
              issue.issueStatus.name.toLowerCase(),
            ))
        ) {
          completedPoints += effectivePoints;
        }
      });

      return {
        sprint_id: s.id,
        sprint_name: s.name,
        committed: committedPoints,
        completed: completedPoints,
      };
    });

    return { success: true, status: 200, data };
  }

  /**
   * Get Issue Completion Rate
   */
  static async getCompletionRate(req, projectId) {
    const { Issue, IssueStatus } = req.db;

    const issues = await Issue.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: IssueStatus,
          as: "issueStatus",
          attributes: ["category"],
        },
      ],
    });

    const total = issues.length;
    if (total === 0) {
      return {
        success: true,
        status: 200,
        data: { rate: 0, total: 0, completed: 0 },
      };
    }

    const completed = issues.filter(
      (i) => i.issueStatus && i.issueStatus.category === "done",
    ).length;

    const rate = ((completed / total) * 100).toFixed(1);

    return {
      success: true,
      status: 200,
      data: {
        rate: parseFloat(rate),
        total,
        completed,
      },
    };
  }

  /**
   * Sprint Burndown
   */
  static async getSprintBurndown(req, sprintId) {
    const { Sprint, Issue, IssueHistory, IssueStatus, UserStory } = req.db;

    const sprint = await Sprint.findByPk(sprintId, {
      include: [
        {
          model: Issue,
          as: "issues",
          attributes: ["id", "status_id", "created_at"],
          include: [
            {
              model: UserStory,
              as: "userStory",
              attributes: ["story_points"],
            },
          ],
        },
      ],
    });

    if (!sprint) {
      return { success: false, status: 404, message: "Sprint not found" };
    }

    if (!sprint.start_date) {
      return {
        success: true,
        status: 200,
        data: [],
        meta: { message: "Sprint has no start date" },
      };
    }

    const startDate = moment(sprint.start_date);
    const endDate = sprint.end_date
      ? moment(sprint.end_date)
      : moment().add(14, "days");
    const now = moment();

    // 1. Prepare Issues Data
    const issueIds = sprint.issues.map((i) => i.id);
    const issuePointsMap = {};
    let totalPointsAtStart = 0;

    sprint.issues.forEach((i) => {
      const pts = i.userStory?.story_points || 0;
      const effectivePoints = pts > 0 ? pts : 1;
      issuePointsMap[i.id] = effectivePoints;
      totalPointsAtStart += effectivePoints;
    });

    if (issueIds.length === 0) {
      return {
        success: true,
        status: 200,
        data: [],
        meta: { totalPoints: 0, startDate, endDate },
      };
    }

    // 2. Get Done Status Names — include both project-specific and global (project_id = null)
    const doneStatuses = await IssueStatus.findAll({
      where: {
        category: "done",
        [Op.or]: [{ project_id: sprint.project_id }, { project_id: null }],
      },
    });
    const doneStatusNames = new Set(doneStatuses.map((s) => s.name));

    // 3. Get History
    const histories = await IssueHistory.findAll({
      where: {
        issue_id: { [Op.in]: issueIds },
        action_type: "status_change",
        created_at: { [Op.gte]: startDate.toDate() },
      },
      order: [["created_at", "ASC"]],
    });

    // Group history by issue
    const issueHistoryMap = {};
    histories.forEach((h) => {
      if (!issueHistoryMap[h.issue_id]) issueHistoryMap[h.issue_id] = [];

      const match = h.comment && h.comment.match(/Status changed to (.+)/);
      if (match && match[1]) {
        issueHistoryMap[h.issue_id].push({
          date: moment(h.created_at),
          statusName: match[1].trim(),
        });
      }
    });

    // 4. Build Timeline
    const chartData = [];
    const days = endDate.diff(startDate, "days") + 1;
    let idealBurnPerDay = totalPointsAtStart / Math.max(days - 1, 1);
    if (days <= 1) idealBurnPerDay = totalPointsAtStart;

    // To handle edge case where idealBurnPerDay is infinite
    if (!Number.isFinite(idealBurnPerDay)) idealBurnPerDay = 0;

    for (let d = 0; d < days; d++) {
      const currentDay = startDate.clone().add(d, "days");
      const endOfDay = currentDay.clone().endOf("day");
      const dateStr = currentDay.format("YYYY-MM-DD");

      // Ideal
      let ideal = totalPointsAtStart - idealBurnPerDay * d;
      if (ideal < 0 || d === days - 1) ideal = 0;

      // Actual
      if (currentDay.isAfter(now, "day")) {
        chartData.push({
          date: dateStr,
          ideal: parseFloat(ideal.toFixed(1)),
          remaining: null,
        });
        continue;
      }

      let remainingPoints = 0;

      issueIds.forEach((id) => {
        const events = issueHistoryMap[id] || [];
        let currentStatus = "Open";

        // Find last event before endOfDay
        for (let i = events.length - 1; i >= 0; i--) {
          if (events[i].date.isSameOrBefore(endOfDay)) {
            currentStatus = events[i].statusName; // Using variable directly from captured match
            break;
          }
        }

        if (!doneStatusNames.has(currentStatus)) {
          remainingPoints += issuePointsMap[id] || 0;
        }
      });

      chartData.push({
        date: dateStr,
        ideal: parseFloat(ideal.toFixed(1)),
        remaining: remainingPoints,
      });
    }

    return {
      success: true,
      status: 200,
      data: chartData,
      meta: {
        sprintName: sprint.name,
        totalPoints: totalPointsAtStart,
        startDate: startDate.format("YYYY-MM-DD"),
        endDate: endDate.format("YYYY-MM-DD"),
      },
    };
  }
}

module.exports = ReportService;
