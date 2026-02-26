// Author: Gururaj
// Description: Daily Log Excel Export Service
// Version: 1.0.0

const { Op } = require("sequelize");
const ExcelJS = require("exceljs");
const moment = require("moment");

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

      const { DailyLog, Task, Project, User } = req.db;
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
            attributes: ["id", "title", "department_id", "priority", "status"],
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

      // Fetch user details for all log owners
      const userIds = [...new Set(logs.map((log) => log.user_id))];
      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ["id", "name", "email"],
        raw: true,
      });
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();

      // 1. Detailed Logs Sheet
      const logsSheet = workbook.addWorksheet("Detailed Logs", {
        pageSetup: { paperSize: 9, orientation: "landscape" },
      });
      this.createLogsSheet(logsSheet, logs, userMap);

      // 2. Project-wise Summary Sheet
      const projectSheet = workbook.addWorksheet("Project Summary");
      await this.createProjectSummarySheet(projectSheet, logs, userMap);

      // 3. Task-wise Summary Sheet
      const taskSheet = workbook.addWorksheet("Task Summary");
      await this.createTaskSummarySheet(taskSheet, logs, userMap);

      // 4. User-wise Summary Sheet
      const userSheet = workbook.addWorksheet("User Summary");
      this.createUserSummarySheet(userSheet, logs, userMap);

      // 5. Department-wise Summary Sheet (if available)
      const departmentSheet = workbook.addWorksheet("Department Summary");
      await this.createDepartmentSummarySheet(departmentSheet, logs);

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
  static createLogsSheet(sheet, logs, userMap) {
    sheet.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "User", key: "userName", width: 18 },
      { header: "Project", key: "projectName", width: 20 },
      { header: "Task", key: "taskTitle", width: 25 },
      { header: "Priority", key: "taskPriority", width: 10 },
      { header: "Status", key: "taskStatus", width: 15 },
      { header: "Duration (hours)", key: "durationHours", width: 15 },
      { header: "Log Type", key: "logType", width: 12 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    // Header styling
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070C0" },
    };
    sheet.getRow(1).alignment = { horizontal: "center", vertical: "center" };

    // Add data rows
    logs.forEach((log) => {
      const user = userMap[log.user_id];
      const durationMinutes = log.actual_duration || log.expected_duration || 0;
      const durationHours = (durationMinutes / 60).toFixed(2);

      sheet.addRow({
        date: moment(log.date).format("YYYY-MM-DD"),
        userName: user?.name || "Unknown",
        projectName: log.project?.name || "N/A",
        taskTitle: log.task?.title || "N/A",
        taskPriority: log.task?.priority || "N/A",
        taskStatus: log.task?.status || "N/A",
        durationHours,
        logType: log.log_type,
        notes: log.notes || "-",
      });
    });

    // Auto-fit columns and set text wrapping
    sheet.columns.forEach((col) => {
      col.alignment = { wrapText: true, vertical: "top" };
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.height = 25;
      }
    });
  }

  /**
   * Create project-wise summary worksheet
   */
  static async createProjectSummarySheet(sheet, logs, userMap) {
    const projectStats = {};

    logs.forEach((log) => {
      const projectId = log.project_id;
      const projectName = log.project?.name || "Unknown";
      const key = `${projectId}-${projectName}`;

      if (!projectStats[key]) {
        projectStats[key] = {
          projectName,
          totalLogs: 0,
          totalMinutes: 0,
          users: new Set(),
          tasks: new Set(),
        };
      }

      projectStats[key].totalLogs++;
      projectStats[key].totalMinutes +=
        log.actual_duration || log.expected_duration || 0;
      projectStats[key].users.add(log.user_id);
      if (log.task_id) projectStats[key].tasks.add(log.task_id);
    });

    sheet.columns = [
      { header: "Project Name", key: "projectName", width: 25 },
      { header: "Total Logs", key: "totalLogs", width: 12 },
      { header: "Total Hours", key: "totalHours", width: 15 },
      { header: "Unique Users", key: "uniqueUsers", width: 12 },
      { header: "Unique Tasks", key: "uniqueTasks", width: 12 },
    ];

    // Header styling
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF00B050" },
    };

    Object.values(projectStats).forEach((stat) => {
      sheet.addRow({
        projectName: stat.projectName,
        totalLogs: stat.totalLogs,
        totalHours: (stat.totalMinutes / 60).toFixed(2),
        uniqueUsers: stat.users.size,
        uniqueTasks: stat.tasks.size,
      });
    });

    sheet.columns.forEach((col) => {
      col.alignment = { horizontal: "center" };
    });
  }

  /**
   * Create task-wise summary worksheet
   */
  static async createTaskSummarySheet(sheet, logs, userMap) {
    const taskStats = {};

    logs.forEach((log) => {
      const taskId = log.task_id;
      const taskTitle = log.task?.title || "Unknown";
      const projectName = log.project?.name || "Unknown";
      const key = `${taskId}-${taskTitle}`;

      if (!taskStats[key]) {
        taskStats[key] = {
          taskTitle,
          projectName,
          priority: log.task?.priority || "N/A",
          status: log.task?.status || "N/A",
          totalLogs: 0,
          totalMinutes: 0,
          users: new Set(),
        };
      }

      taskStats[key].totalLogs++;
      taskStats[key].totalMinutes +=
        log.actual_duration || log.expected_duration || 0;
      taskStats[key].users.add(log.user_id);
    });

    sheet.columns = [
      { header: "Task Title", key: "taskTitle", width: 25 },
      { header: "Project", key: "projectName", width: 20 },
      { header: "Priority", key: "priority", width: 12 },
      { header: "Status", key: "status", width: 15 },
      { header: "Total Logs", key: "totalLogs", width: 12 },
      { header: "Total Hours", key: "totalHours", width: 15 },
      { header: "Users Assigned", key: "usersAssigned", width: 12 },
    ];

    // Header styling
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFC65911" },
    };

    Object.values(taskStats).forEach((stat) => {
      sheet.addRow({
        taskTitle: stat.taskTitle,
        projectName: stat.projectName,
        priority: stat.priority,
        status: stat.status,
        totalLogs: stat.totalLogs,
        totalHours: (stat.totalMinutes / 60).toFixed(2),
        usersAssigned: stat.users.size,
      });
    });

    sheet.columns.forEach((col) => {
      col.alignment = { wrapText: true, vertical: "center" };
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
          totalMinutes: 0,
          projects: new Set(),
          tasks: new Set(),
        };
      }

      userStats[userId].totalLogs++;
      userStats[userId].totalMinutes +=
        log.actual_duration || log.expected_duration || 0;
      userStats[userId].projects.add(log.project_id);
      if (log.task_id) userStats[userId].tasks.add(log.task_id);
    });

    sheet.columns = [
      { header: "User Name", key: "userName", width: 18 },
      { header: "Email", key: "email", width: 25 },
      { header: "Total Logs", key: "totalLogs", width: 12 },
      { header: "Total Hours", key: "totalHours", width: 15 },
      { header: "Projects", key: "projects", width: 12 },
      { header: "Tasks", key: "tasks", width: 12 },
    ];

    // Header styling
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF7030A0" },
    };

    Object.values(userStats).forEach((stat) => {
      sheet.addRow({
        userName: stat.userName,
        email: stat.email,
        totalLogs: stat.totalLogs,
        totalHours: (stat.totalMinutes / 60).toFixed(2),
        projects: stat.projects.size,
        tasks: stat.tasks.size,
      });
    });

    sheet.columns.forEach((col) => {
      col.alignment = { horizontal: "center" };
    });
  }

  /**
   * Create department-wise summary worksheet
   */
  static async createDepartmentSummarySheet(sheet, logs) {
    const deptStats = {};

    logs.forEach((log) => {
      const deptId = log.task?.department_id || "unknown";

      if (!deptStats[deptId]) {
        deptStats[deptId] = {
          totalLogs: 0,
          totalMinutes: 0,
          users: new Set(),
          projects: new Set(),
          tasks: new Set(),
        };
      }

      deptStats[deptId].totalLogs++;
      deptStats[deptId].totalMinutes +=
        log.actual_duration || log.expected_duration || 0;
      deptStats[deptId].users.add(log.user_id);
      deptStats[deptId].projects.add(log.project_id);
      if (log.task_id) deptStats[deptId].tasks.add(log.task_id);
    });

    sheet.columns = [
      { header: "Department ID", key: "deptId", width: 25 },
      { header: "Total Logs", key: "totalLogs", width: 12 },
      { header: "Total Hours", key: "totalHours", width: 15 },
      { header: "Unique Users", key: "uniqueUsers", width: 12 },
      { header: "Projects", key: "projects", width: 12 },
      { header: "Tasks", key: "tasks", width: 12 },
    ];

    // Header styling
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF404040" },
    };

    Object.entries(deptStats).forEach(([deptId, stat]) => {
      sheet.addRow({
        deptId: deptId || "No Department",
        totalLogs: stat.totalLogs,
        totalHours: (stat.totalMinutes / 60).toFixed(2),
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
    const totalMinutes = logs.reduce(
      (sum, log) => sum + (log.actual_duration || log.expected_duration || 0),
      0,
    );
    const uniqueUsers = new Set(logs.map((log) => log.user_id)).size;
    const uniqueProjects = new Set(logs.map((log) => log.project_id)).size;
    const uniqueTasks = new Set(
      logs.filter((l) => l.task_id).map((l) => l.task_id),
    ).size;

    sheet.columns = [
      { header: "Metric", key: "metric", width: 25 },
      { header: "Value", key: "value", width: 20 },
    ];

    // Header styling
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070C0" },
    };

    // Data rows
    const data = [
      {
        metric: "Report Generated",
        value: moment().format("YYYY-MM-DD HH:mm"),
      },
      { metric: "Total Logs", value: logs.length },
      { metric: "Total Hours", value: (totalMinutes / 60).toFixed(2) },
      { metric: "Unique Users", value: uniqueUsers },
      { metric: "Unique Projects", value: uniqueProjects },
      { metric: "Unique Tasks", value: uniqueTasks },
      { metric: "Date From", value: filters.fromDate || "All" },
      { metric: "Date To", value: filters.toDate || "All" },
      { metric: "Filter: Project", value: filters.project || "None" },
      { metric: "Filter: User", value: filters.user || "None" },
      { metric: "Filter: Department", value: filters.department || "None" },
    ];

    data.forEach((row) => {
      sheet.addRow(row);
    });

    sheet.getColumn(1).alignment = { horizontal: "left" };
    sheet.getColumn(2).alignment = { horizontal: "right" };

    // Make data rows bold
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.font = { bold: true };
      }
    });
  }
}

module.exports = ReportsExportService;
