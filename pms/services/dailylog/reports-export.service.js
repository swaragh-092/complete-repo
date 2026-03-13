// Author: Gururaj
// Description: Daily Log Excel Export Service
// Version: 1.0.0

const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const moment = require("moment");
const { authClient } = require("../serviceClients");
const { DOMAIN } = require("../../config/config");

class ReportsExportService {
  /**
   * Validates and processes filters for Excel export
   * Required: At least one of (project, user, department)
   * Optional: date range (max 1 year, past dates only)
   */
  static validateFilters(filters) {
    const { project, user, department, fromDate, toDate } = filters;

    // Check that at least one mandatory filter is provided
    if (!project && !user && !department) {
      return {
        success: false,
        error: "At least one filter (project, user, or department) is required",
      };
    }

    // Validate date range if provided
    if (fromDate || toDate) {
      if (!fromDate || !toDate) {
        return {
          success: false,
          error: "Both fromDate and toDate must be provided together",
        };
      }

      const from = moment(fromDate);
      const to = moment(toDate);
      const today = moment().startOf("day");

      if (!from.isValid() || !to.isValid()) {
        return { success: false, error: "Invalid date format. Use YYYY-MM-DD" };
      }

      if (to.isAfter(today)) {
        return { success: false, error: "End date cannot be in the future" };
      }

      if (from.isAfter(to)) {
        return {
          success: false,
          error: "Start date cannot be after end date",
        };
      }

      const diffDays = to.diff(from, "days");
      if (diffDays > 365) {
        return {
          success: false,
          error: "Date range cannot exceed 365 days (1 year)",
        };
      }
    }

    return { success: true };
  }

  /**
   * Generate Excel export with multiple sheets
   */
  static async generateExcel(req) {
    try {
      const { project, user, department, fromDate, toDate } = req.query;

      // Validate filters
      const validation = this.validateFilters({
        project,
        user,
        department,
        fromDate,
        toDate,
      });

      if (!validation.success) {
        return {
          success: false,
          status: 400,
          message: validation.error,
        };
      }

      const { DailyLog, Task, Project } = req.db;
      const whereConditions = {};

      // Build WHERE clause for DailyLog
      if (project) {
        whereConditions.project_id = project;
      }
      if (user) {
        whereConditions.user_id = user;
      }

      // Add date range filter
      if (fromDate && toDate) {
        whereConditions.date = {
          [Op.between]: [fromDate, toDate],
        };
      }

      // Get all logs matching filters
      let logs = await DailyLog.findAll({
        where: whereConditions,
        include: [
          {
            model: Project,
            as: "project",
            attributes: ["id", "name", "description"],
          },
          {
            model: Task,
            as: "task",
            attributes: [
              "id",
              "title",
              "description",
              "department_id",
              "priority",
              "status",
              "task_for",
              "due_date",
              "taken_at",
              "completed_at",
            ],
          },
        ],
        order: [["date", "ASC"]],
        raw: false,
      });

      // Filter by department if provided
      if (department) {
        logs = logs.filter((log) => log.task?.department_id === department);
      }

      if (!logs.length) {
        return {
          success: false,
          status: 404,
          message: "No logs found matching the provided filters",
        };
      }

      // Fetch user details for all log owners from auth-service
      const userIds = [
        ...new Set(logs.map((log) => log.user_id).filter(Boolean)),
      ];
      const userMap = {};
      if (userIds.length > 0) {
        try {
          const authSvc = authClient();
          const userResponse = await authSvc.post(
            `${DOMAIN.auth}/auth/internal/users/lookup`,
            { user_ids: userIds, user_id_type: "id" },
          );
          const fetchedUsers = userResponse.data?.data?.users || [];
          for (const u of fetchedUsers) {
            if (u.id)
              userMap[u.id] = { id: u.id, name: u.name, email: u.email };
          }
        } catch (authErr) {
          console.warn(
            "[exportExcel] Failed to fetch user details from auth-service:",
            authErr.message,
          );
        }
      }

      // Fetch department (workspace) names from auth-service
      const deptMap = {};
      const uniqueDeptIds = [
        ...new Set(logs.map((log) => log.task?.department_id).filter(Boolean)),
      ];
      if (uniqueDeptIds.length > 0) {
        try {
          const authSvc2 = authClient();
          const deptResponse = await authSvc2.post(
            `${DOMAIN.auth}/auth/workspaces/batch-lookup`,
            { workspace_ids: uniqueDeptIds },
          );
          const workspaces = deptResponse.data?.data?.workspaces || [];
          for (const ws of workspaces) {
            if (ws.id) deptMap[ws.id] = { id: ws.id, name: ws.name };
          }
        } catch (deptErr) {
          console.warn(
            "[exportExcel] Failed to fetch department names:",
            deptErr.message,
          );
        }
      }

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();

      // 1. Detailed Logs Sheet
      const logsSheet = workbook.addWorksheet("Detailed Logs", {
        pageSetup: { paperSize: 9, orientation: "landscape" },
      });
      this.createLogsSheet(logsSheet, logs, userMap, deptMap);

      // 2. Project-wise Summary Sheet
      const projectSheet = workbook.addWorksheet("Project Summary");
      this.createProjectSummarySheet(projectSheet, logs, userMap);

      // 3. Task-wise Summary Sheet
      const taskSheet = workbook.addWorksheet("Task Summary");
      this.createTaskSummarySheet(taskSheet, logs, userMap, deptMap);

      // 4. User-wise Summary Sheet
      const userSheet = workbook.addWorksheet("User Summary");
      this.createUserSummarySheet(userSheet, logs, userMap);

      // 5. Department-wise Summary Sheet
      const departmentSheet = workbook.addWorksheet("Department Summary");
      this.createDepartmentSummarySheet(departmentSheet, logs, deptMap);

      // 6. Overall Summary Sheet
      const summarySheet = workbook.addWorksheet("Overall Summary", {
        state: "visible",
      });
      this.createOverallSummarySheet(summarySheet, logs, {
        fromDate,
        toDate,
        project,
        user,
        department,
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      return {
        success: true,
        status: 200,
        data: {
          buffer,
          filename: `Daily-Logs-Report-${moment().format("YYYY-MM-DD-HHmmss")}.xlsx`,
          totalLogs: logs.length,
        },
      };
    } catch (err) {
      console.error("Error generating Excel export:", err);
      return {
        success: false,
        status: 500,
        message: "Error generating Excel report",
        error: err.message,
      };
    }
  }

  /**
   * Create detailed logs worksheet
   */
  static createLogsSheet(sheet, logs, userMap, deptMap) {
    sheet.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "User", key: "userName", width: 20 },
      { header: "Email", key: "userEmail", width: 26 },
      { header: "Project", key: "projectName", width: 20 },
      { header: "Department", key: "deptName", width: 20 },
      { header: "Task", key: "taskTitle", width: 28 },
      { header: "Task Description", key: "taskDesc", width: 35 },
      { header: "Task Type", key: "taskType", width: 14 },
      { header: "Priority", key: "taskPriority", width: 10 },
      { header: "Task Status", key: "taskStatus", width: 16 },
      { header: "Due Date", key: "dueDate", width: 13 },
      { header: "Task Started", key: "takenAt", width: 18 },
      { header: "Task Completed", key: "completedAt", width: 18 },
      { header: "Log Type", key: "logType", width: 12 },
      { header: "Log Status", key: "logStatus", width: 14 },
      { header: "Expected (hours)", key: "expectedHours", width: 16 },
      { header: "Actual (hours)", key: "actualHours", width: 14 },
      { header: "Notes", key: "notes", width: 35 },
    ];

    // Header styling
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070C0" },
    };
    sheet.getRow(1).alignment = { horizontal: "center", vertical: "center" };
    sheet.getRow(1).height = 22;

    const statusColors = {
      completed: "FFE2EFDA",
      in_progress: "FFDDEEFF",
      blocked: "FFFCE4D6",
      not_taken: "FFF2F2F2",
    };

    // Add data rows
    logs.forEach((log) => {
      const user = userMap[log.user_id];
      const dept = deptMap[log.task?.department_id];
      const expectedHours = log.expected_duration
        ? (log.expected_duration / 60).toFixed(2)
        : "-";
      const actualHours = log.actual_duration
        ? (log.actual_duration / 60).toFixed(2)
        : "-";

      const row = sheet.addRow({
        date: moment(log.date).format("YYYY-MM-DD"),
        userName: user?.name || "Unknown",
        userEmail: user?.email || "-",
        projectName: log.project?.name || "N/A",
        deptName: dept?.name || log.task?.department_id || "N/A",
        taskTitle: log.task?.title || "N/A",
        taskDesc: log.task?.description || "-",
        taskType: log.task?.task_for || "normal",
        taskPriority: log.task?.priority || "N/A",
        taskStatus: log.task?.status || "N/A",
        dueDate: log.task?.due_date
          ? moment(log.task.due_date).format("YYYY-MM-DD")
          : "-",
        takenAt: log.task?.taken_at
          ? moment(log.task.taken_at).format("YYYY-MM-DD HH:mm")
          : "-",
        completedAt: log.task?.completed_at
          ? moment(log.task.completed_at).format("YYYY-MM-DD HH:mm")
          : "-",
        logType: log.log_type,
        logStatus: log.status || "-",
        expectedHours,
        actualHours,
        notes: log.notes || "-",
      });

      // Colour-code rows by log status
      const bgArgb = statusColors[log.status];
      if (bgArgb) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: bgArgb },
        };
      }
      row.height = 28;
    });

    // Text wrapping for all columns
    sheet.columns.forEach((col) => {
      col.alignment = { wrapText: true, vertical: "top" };
    });
  }

  /**
   * Create project-wise summary worksheet
   */
  static createProjectSummarySheet(sheet, logs, userMap) {
    const projectStats = {};

    logs.forEach((log) => {
      const projectId = log.project_id;
      const projectName = log.project?.name || "Unknown";
      const key = `${projectId}-${projectName}`;

      if (!projectStats[key]) {
        projectStats[key] = {
          projectName,
          description: log.project?.description || "-",
          totalLogs: 0,
          standups: 0,
          wrapups: 0,
          totalExpectedMinutes: 0,
          totalActualMinutes: 0,
          users: new Set(),
          tasks: new Set(),
          departments: new Set(),
        };
      }

      projectStats[key].totalLogs++;
      if (log.log_type === "standup") projectStats[key].standups++;
      if (log.log_type === "wrapup") projectStats[key].wrapups++;
      projectStats[key].totalExpectedMinutes += log.expected_duration || 0;
      projectStats[key].totalActualMinutes += log.actual_duration || 0;
      projectStats[key].users.add(log.user_id);
      if (log.task_id) projectStats[key].tasks.add(log.task_id);
      if (log.task?.department_id)
        projectStats[key].departments.add(log.task.department_id);
    });

    sheet.columns = [
      { header: "Project Name", key: "projectName", width: 25 },
      { header: "Description", key: "description", width: 30 },
      { header: "Total Logs", key: "totalLogs", width: 12 },
      { header: "Standups", key: "standups", width: 11 },
      { header: "Wrapups", key: "wrapups", width: 11 },
      { header: "Expected Hours", key: "expectedHours", width: 15 },
      { header: "Actual Hours", key: "actualHours", width: 14 },
      { header: "Unique Users", key: "uniqueUsers", width: 13 },
      { header: "Unique Tasks", key: "uniqueTasks", width: 13 },
      { header: "Departments Covered", key: "deptsCovered", width: 20 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF00B050" },
    };
    sheet.getRow(1).alignment = { horizontal: "center", vertical: "center" };

    Object.values(projectStats).forEach((stat) => {
      sheet.addRow({
        projectName: stat.projectName,
        description: stat.description,
        totalLogs: stat.totalLogs,
        standups: stat.standups,
        wrapups: stat.wrapups,
        expectedHours: (stat.totalExpectedMinutes / 60).toFixed(2),
        actualHours: (stat.totalActualMinutes / 60).toFixed(2),
        uniqueUsers: stat.users.size,
        uniqueTasks: stat.tasks.size,
        deptsCovered: stat.departments.size,
      });
    });

    sheet.columns.forEach((col) => {
      col.alignment = { horizontal: "center", wrapText: true };
    });
  }

  /**
   * Create task-wise summary worksheet
   */
  static createTaskSummarySheet(sheet, logs, userMap, deptMap) {
    const taskStats = {};

    logs.forEach((log) => {
      const taskId = log.task_id;
      const taskTitle = log.task?.title || "Unknown";
      const key = `${taskId}-${taskTitle}`;

      if (!taskStats[key]) {
        const deptId = log.task?.department_id;
        taskStats[key] = {
          taskTitle,
          taskDesc: log.task?.description || "-",
          taskType: log.task?.task_for || "normal",
          projectName: log.project?.name || "Unknown",
          deptName: deptMap[deptId]?.name || deptId || "N/A",
          priority: log.task?.priority || "N/A",
          status: log.task?.status || "N/A",
          dueDate: log.task?.due_date
            ? moment(log.task.due_date).format("YYYY-MM-DD")
            : "-",
          takenAt: log.task?.taken_at
            ? moment(log.task.taken_at).format("YYYY-MM-DD HH:mm")
            : "-",
          completedAt: log.task?.completed_at
            ? moment(log.task.completed_at).format("YYYY-MM-DD HH:mm")
            : "-",
          totalLogs: 0,
          totalExpectedMinutes: 0,
          totalActualMinutes: 0,
          users: new Set(),
        };
      }

      taskStats[key].totalLogs++;
      taskStats[key].totalExpectedMinutes += log.expected_duration || 0;
      taskStats[key].totalActualMinutes += log.actual_duration || 0;
      taskStats[key].users.add(log.user_id);
    });

    sheet.columns = [
      { header: "Task Title", key: "taskTitle", width: 28 },
      { header: "Description", key: "taskDesc", width: 35 },
      { header: "Task Type", key: "taskType", width: 14 },
      { header: "Project", key: "projectName", width: 20 },
      { header: "Department", key: "deptName", width: 20 },
      { header: "Priority", key: "priority", width: 12 },
      { header: "Status", key: "status", width: 16 },
      { header: "Due Date", key: "dueDate", width: 13 },
      { header: "Task Started", key: "takenAt", width: 18 },
      { header: "Task Completed", key: "completedAt", width: 18 },
      { header: "Total Logs", key: "totalLogs", width: 11 },
      { header: "Expected Hours", key: "expectedHours", width: 15 },
      { header: "Actual Hours", key: "actualHours", width: 13 },
      { header: "Avg Hours/Log", key: "avgHours", width: 13 },
      { header: "Contributors", key: "contributors", width: 13 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFC65911" },
    };
    sheet.getRow(1).alignment = { horizontal: "center", vertical: "center" };

    Object.values(taskStats).forEach((stat) => {
      const actualHours = (stat.totalActualMinutes / 60).toFixed(2);
      const expectedHours = (stat.totalExpectedMinutes / 60).toFixed(2);
      const avgHours =
        stat.totalLogs > 0
          ? (
              (stat.totalActualMinutes || stat.totalExpectedMinutes) /
              60 /
              stat.totalLogs
            ).toFixed(2)
          : "0.00";
      sheet.addRow({
        taskTitle: stat.taskTitle,
        taskDesc: stat.taskDesc,
        taskType: stat.taskType,
        projectName: stat.projectName,
        deptName: stat.deptName,
        priority: stat.priority,
        status: stat.status,
        dueDate: stat.dueDate,
        takenAt: stat.takenAt,
        completedAt: stat.completedAt,
        totalLogs: stat.totalLogs,
        expectedHours,
        actualHours,
        avgHours,
        contributors: stat.users.size,
      });
    });

    sheet.columns.forEach((col) => {
      col.alignment = { wrapText: true, vertical: "top" };
    });
  }

  /**
   * Create user-wise summary worksheet
   */
  static createUserSummarySheet(sheet, logs, userMap) {
    const userStats = {};

    logs.forEach((log) => {
      const userId = log.user_id;

      if (!userStats[userId]) {
        const user = userMap[userId] || {};
        userStats[userId] = {
          userName: user.name || "Unknown",
          email: user.email || "N/A",
          totalLogs: 0,
          standups: 0,
          wrapups: 0,
          totalExpectedMinutes: 0,
          totalActualMinutes: 0,
          completedLogs: 0,
          blockedLogs: 0,
          projects: new Set(),
          tasks: new Set(),
          departments: new Set(),
        };
      }

      userStats[userId].totalLogs++;
      if (log.log_type === "standup") userStats[userId].standups++;
      if (log.log_type === "wrapup") userStats[userId].wrapups++;
      if (log.status === "completed") userStats[userId].completedLogs++;
      if (log.status === "blocked") userStats[userId].blockedLogs++;
      userStats[userId].totalExpectedMinutes += log.expected_duration || 0;
      userStats[userId].totalActualMinutes += log.actual_duration || 0;
      userStats[userId].projects.add(log.project_id);
      if (log.task_id) userStats[userId].tasks.add(log.task_id);
      if (log.task?.department_id)
        userStats[userId].departments.add(log.task.department_id);
    });

    sheet.columns = [
      { header: "User Name", key: "userName", width: 20 },
      { header: "Email", key: "email", width: 26 },
      { header: "Total Logs", key: "totalLogs", width: 12 },
      { header: "Standups", key: "standups", width: 11 },
      { header: "Wrapups", key: "wrapups", width: 11 },
      { header: "Expected Hours", key: "expectedHours", width: 15 },
      { header: "Actual Hours", key: "actualHours", width: 14 },
      { header: "Avg Hours/Log", key: "avgHours", width: 14 },
      { header: "Completed Logs", key: "completedLogs", width: 14 },
      { header: "Blocked Logs", key: "blockedLogs", width: 13 },
      { header: "Projects", key: "projects", width: 11 },
      { header: "Tasks", key: "tasks", width: 11 },
      { header: "Departments", key: "departments", width: 13 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF7030A0" },
    };
    sheet.getRow(1).alignment = { horizontal: "center", vertical: "center" };

    Object.values(userStats).forEach((stat) => {
      const totalMinutes = stat.totalActualMinutes || stat.totalExpectedMinutes;
      const avgHours =
        stat.totalLogs > 0
          ? (totalMinutes / 60 / stat.totalLogs).toFixed(2)
          : "0.00";
      sheet.addRow({
        userName: stat.userName,
        email: stat.email,
        totalLogs: stat.totalLogs,
        standups: stat.standups,
        wrapups: stat.wrapups,
        expectedHours: (stat.totalExpectedMinutes / 60).toFixed(2),
        actualHours: (stat.totalActualMinutes / 60).toFixed(2),
        avgHours,
        completedLogs: stat.completedLogs,
        blockedLogs: stat.blockedLogs,
        projects: stat.projects.size,
        tasks: stat.tasks.size,
        departments: stat.departments.size,
      });
    });

    sheet.columns.forEach((col) => {
      col.alignment = { horizontal: "center" };
    });
  }

  /**
   * Create department-wise summary worksheet
   */
  static createDepartmentSummarySheet(sheet, logs, deptMap) {
    const deptStats = {};

    logs.forEach((log) => {
      const deptId = log.task?.department_id || "unknown";

      if (!deptStats[deptId]) {
        deptStats[deptId] = {
          deptName: deptMap[deptId]?.name || deptId || "No Department",
          totalLogs: 0,
          standups: 0,
          wrapups: 0,
          totalExpectedMinutes: 0,
          totalActualMinutes: 0,
          completedLogs: 0,
          blockedLogs: 0,
          users: new Set(),
          projects: new Set(),
          tasks: new Set(),
        };
      }

      deptStats[deptId].totalLogs++;
      if (log.log_type === "standup") deptStats[deptId].standups++;
      if (log.log_type === "wrapup") deptStats[deptId].wrapups++;
      if (log.status === "completed") deptStats[deptId].completedLogs++;
      if (log.status === "blocked") deptStats[deptId].blockedLogs++;
      deptStats[deptId].totalExpectedMinutes += log.expected_duration || 0;
      deptStats[deptId].totalActualMinutes += log.actual_duration || 0;
      deptStats[deptId].users.add(log.user_id);
      deptStats[deptId].projects.add(log.project_id);
      if (log.task_id) deptStats[deptId].tasks.add(log.task_id);
    });

    sheet.columns = [
      { header: "Department", key: "deptName", width: 24 },
      { header: "Total Logs", key: "totalLogs", width: 12 },
      { header: "Standups", key: "standups", width: 11 },
      { header: "Wrapups", key: "wrapups", width: 11 },
      { header: "Expected Hours", key: "expectedHours", width: 15 },
      { header: "Actual Hours", key: "actualHours", width: 14 },
      { header: "Avg Hours/Log", key: "avgHours", width: 14 },
      { header: "Completed Logs", key: "completedLogs", width: 15 },
      { header: "Blocked Logs", key: "blockedLogs", width: 13 },
      { header: "Unique Users", key: "uniqueUsers", width: 13 },
      { header: "Projects", key: "projects", width: 11 },
      { header: "Tasks", key: "tasks", width: 11 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF404040" },
    };
    sheet.getRow(1).alignment = { horizontal: "center", vertical: "center" };

    Object.values(deptStats).forEach((stat) => {
      const totalMinutes = stat.totalActualMinutes || stat.totalExpectedMinutes;
      const avgHours =
        stat.totalLogs > 0
          ? (totalMinutes / 60 / stat.totalLogs).toFixed(2)
          : "0.00";
      sheet.addRow({
        deptName: stat.deptName,
        totalLogs: stat.totalLogs,
        standups: stat.standups,
        wrapups: stat.wrapups,
        expectedHours: (stat.totalExpectedMinutes / 60).toFixed(2),
        actualHours: (stat.totalActualMinutes / 60).toFixed(2),
        avgHours,
        completedLogs: stat.completedLogs,
        blockedLogs: stat.blockedLogs,
        uniqueUsers: stat.users.size,
        projects: stat.projects.size,
        tasks: stat.tasks.size,
      });
    });

    sheet.columns.forEach((col) => {
      col.alignment = { horizontal: "center" };
    });
  }

  /**
   * Create overall summary worksheet
   */
  static createOverallSummarySheet(sheet, logs, filters) {
    const totalExpectedMinutes = logs.reduce(
      (s, l) => s + (l.expected_duration || 0),
      0,
    );
    const totalActualMinutes = logs.reduce(
      (s, l) => s + (l.actual_duration || 0),
      0,
    );
    const standups = logs.filter((l) => l.log_type === "standup").length;
    const wrapups = logs.filter((l) => l.log_type === "wrapup").length;
    const completed = logs.filter((l) => l.status === "completed").length;
    const inProgress = logs.filter((l) => l.status === "in_progress").length;
    const blocked = logs.filter((l) => l.status === "blocked").length;
    const notTaken = logs.filter((l) => l.status === "not_taken").length;
    const uniqueUsers = new Set(logs.map((l) => l.user_id)).size;
    const uniqueProjects = new Set(logs.map((l) => l.project_id)).size;
    const uniqueTasks = new Set(
      logs.filter((l) => l.task_id).map((l) => l.task_id),
    ).size;
    const uniqueDepts = new Set(
      logs.map((l) => l.task?.department_id).filter(Boolean),
    ).size;
    const avgHoursPerLog =
      logs.length > 0
        ? (
            (totalActualMinutes || totalExpectedMinutes) /
            60 /
            logs.length
          ).toFixed(2)
        : "0.00";

    sheet.columns = [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 22 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070C0" },
    };

    const sections = [
      // Report meta
      {
        metric: "Report Generated",
        value: moment().format("YYYY-MM-DD HH:mm"),
      },
      { metric: "Date From Filter", value: filters.fromDate || "All" },
      { metric: "Date To Filter", value: filters.toDate || "All" },
      { metric: "Filter: Project", value: filters.project || "None" },
      { metric: "Filter: User", value: filters.user || "None" },
      { metric: "Filter: Department", value: filters.department || "None" },
      { metric: "─── Log Counts ───", value: "" },
      { metric: "Total Logs", value: logs.length },
      { metric: "Standups", value: standups },
      { metric: "Wrapups", value: wrapups },
      { metric: "─── Log Status ───", value: "" },
      { metric: "Completed", value: completed },
      { metric: "In Progress", value: inProgress },
      { metric: "Blocked", value: blocked },
      { metric: "Not Taken", value: notTaken },
      { metric: "─── Hours ───", value: "" },
      {
        metric: "Total Expected Hours",
        value: (totalExpectedMinutes / 60).toFixed(2),
      },
      {
        metric: "Total Actual Hours",
        value: (totalActualMinutes / 60).toFixed(2),
      },
      { metric: "Avg Hours per Log", value: avgHoursPerLog },
      { metric: "─── Scope ───", value: "" },
      { metric: "Unique Users", value: uniqueUsers },
      { metric: "Unique Projects", value: uniqueProjects },
      { metric: "Unique Tasks", value: uniqueTasks },
      { metric: "Departments Covered", value: uniqueDepts },
    ];

    sections.forEach((row) => {
      const r = sheet.addRow(row);
      if (String(row.metric).startsWith("───")) {
        r.font = { bold: true, italic: true, color: { argb: "FF595959" } };
        r.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF2F2F2" },
        };
      } else {
        r.font = { bold: true };
      }
    });

    sheet.getColumn(1).alignment = { horizontal: "left" };
    sheet.getColumn(2).alignment = { horizontal: "right" };
  }
}

module.exports = ReportsExportService;
