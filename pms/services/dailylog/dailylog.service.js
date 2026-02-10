// Author: Gururaj
// Created: 14th oct 2025
// Description: daily log service ( standup and wrapup )
// Version: 1.0.0
// Modified:

const { Op } = require("sequelize");
const {
  paginateHelperFunction,
  auditLogCreateHelperFunction,
  auditLogUpdateHelperFunction,
} = require("../../util/helper");

// helper function to convert duration to minutes
function durationToMinutes(duration) {

  if (!duration || typeof duration !== "string") return 0;

  const [hoursStr, minutesStr] = duration.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error("Invalid duration format. Expected HH:MM");
  }

  return hours * 60 + minutes;
}

class DailyLogService {
  /**
   * Start a task → creates a Stand-Up log
   * @param {Object} data - { user_id, project_id, task_id, date, expected_duration, notes }
   */
  static async createStandUp( req, data ) {

    const { DailyLog, Task } = req.db;

    const { task_id, expected_duration, notes } = data;

    const task = await Task.findByPk(task_id, {
      include: [{ association: "assigned" }, { association: "project" }],
    });

    if (!task) return { success: false, status: 404, message: "Taks not found!" };

    if (task.assigned && task.assigned.user_id !== req.user.id)
      return {
        success: false,
        status: 401,
        message: "User not assigned to that task!.",
      };

    const previousSameLog = await DailyLog.findOne({
      where: {
        user_id: req.user.id,
        task_id: task.id,
        date: new Date(),
      },
    });

    if (previousSameLog)
      return {
        success: false,
        status: 409,
        message: "This Task already taken.",
      };

    const createData = {
      user_id: req.user.id,
      project_id: task.project.id,
      task_id,
      date: new Date(),
      log_type: "standup",
      expected_duration: durationToMinutes(expected_duration),
      notes: notes || null,
    };

   

    const standup = await auditLogCreateHelperFunction({
      model: DailyLog,
      data: createData,
      req,
    });

    return { data: standup, success: true, status: 201 };
  }

  /**
   * Get all daily logs (both Stand-Up and Wrap-Up) for a user on a specific date
   * @param {UUID} user_id
   * @param {String|Date} date - YYYY-MM-DD
   */
  static async getUserDailyLogs(req, date = new Date() ) {
    const { DailyLog, Task } = req.db;

    const [user_id, query] = [req.user.id, req.query];

    const result = await paginateHelperFunction({
      model: DailyLog,
      whereFilters: { user_id, date },
      extrasInQuery: {
        include : [ {association: "task", } ],
      },
      orderQuery: {order: [[{ model: Task, as: "task" }, "live_status", "asc"]]},
      query,
    });

    return { status: 200, data: result, success : true };
  }

  static async getNonStandupTasks(req) {
    const { DailyLog, Task } = req.db;
    const [user_id, query] = [req.user.id, req.query];

    const today = new Date().toISOString().slice(0, 10);
    const dailyLogs = await DailyLog.findAll({
      attributes: ["task_id"],
      where: {
        date: today,
        user_id,
      },
      raw: true,
    });

    // Now safely map
    const logTaskIds = dailyLogs.map(row => row.task_id);

    const result = await paginateHelperFunction({
      model: Task,
      whereFilters: {
        [Op.or]: [
          { last_start_time: { [Op.not]: null } },
          { last_worked_date: today }
        ],
        id: {
          [Op.notIn]: logTaskIds
        }
      },
      extrasInQuery : {
          include: [
            {
              association: "assigned",
              where: { user_id }
            }
          ]
        },
      orderQuery: {order: [["live_status", "ASC"]]},
      query
    });

    return {
      status: 200,
      success: true,
      data: result
    };
  }



  static async getTaskLogs(req,  task_id) {
    const { DailyLog, Task } = req.db;
    const { query } = req;
    const task = await Task.findByPk(task_id, {
      include: [{ association: "assigned" }],
    });

    if (!task)
      return { success: false, status: 404, message: "Task not found!" };

    if (task.assigned && task.assigned.user_id !== req.user.id)
      return {
        success: false,
        status: 401,
        message: "User not assigned to that task!.",
      };

    const result = await paginateHelperFunction({
      model: DailyLog,
      whereFilters: { user_id: req.user.id, task_id },
      query,
    });

    return { data: result, status: 200, success: true };
  }

  static async getProjectLogs( req, project_id,) {
    const { DailyLog, Project } = req.db;
    const { query } = req;
    const project = await Project.findByPk(project_id, {
      include: [
        {
          association: "members",
          // where: { user_id: req.user.id },
          // required: true, // to-do = where here it should get only his daily log if there is no permission
        },
      ],
    });
    if (!project)
      return {
        success: false,
        status: 404,
        message: "Project where you are in not found!.",
      };

    const result = await paginateHelperFunction({
      model: DailyLog,
      whereFilters: { user_id: req.user.id, project_id },
      extrasInQuery: {include: [ {association: "task", } ],},
      query,
    });

    return { data: result, status: 200, success: true };
  }

  /**
   * Update a DailyLog entry (mostly for Wrap-Up corrections)
   * @param {UUID} log_id
   * @param {Object} updates - { actual_duration, status, notes }
   */
  static async updateLogNote(req, updates) {
    const { DailyLog } = req.db;
    const log = await DailyLog.findByPk(updates.log_id, {
      where: { user_id: req.user.id },
    });
    if (!log) return { success: false, status: 404, message: "Log not found!" };

    const updatedLog = await auditLogUpdateHelperFunction({
      model: log,
      data: { notes: updates.notes },
      req,
    });

    return { success: true, status: 200, data: updatedLog };
  }

    
}

module.exports = DailyLogService;
