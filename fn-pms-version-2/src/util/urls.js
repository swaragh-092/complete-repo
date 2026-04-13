// Author: Gururaj
// Created: 23rd May 2025
// Description: This is to mainteain overall endpoints and paths.
// Version: 1.0.0
// Modified:
// file : src/util/urls.js

const domain = import.meta.env.VITE_API_BASE_URL;

const BACKEND_ENDPOINT = {
  // dashboard
  overview: { path: domain + "/project/overview", method: "GET" },
  member_dashboard: { path: domain + "/project/member-dashboard", method: "GET" },

  // notifications
  notification: { path: domain + "/notification", method: "GET" },
  mark_read: (notificationId) => {
    return { path: domain + `/notification/${notificationId}`, method: "PUT" };
  },
  has_notifications: { path: domain + "/notification/unread-count", method: "GET" },

  // user stories
  create_user_story: (featureId) => {
    return { path: domain + `/user-story/feature/${featureId}`, method: "POST" };
  },
  user_stories_by_feature: (featureId) => {
    return { path: domain + `/user-story/feature/${featureId}`, method: "GET" };
  },
  user_stories_by_project: (projectId) => {
    return { path: domain + `/user-story/project/${projectId}`, method: "GET" };
  },
  user_stories_by_project_department: (projectId, departmentId) => {
    return { path: domain + `/user-story/project/${projectId}/department/${departmentId}`, method: "GET" };
  },
  user_story_detail: (userStoryId) => {
    return { path: domain + `/user-story/${userStoryId}`, method: "GET" };
  },
  update_user_story: (userStoryId) => {
    return { path: domain + `/user-story/${userStoryId}`, method: "PUT" };
  },
  delete_user_story: (userStoryId) => {
    return { path: domain + `/user-story/${userStoryId}`, method: "DELETE" };
  },
  user_story_completion: (projectId) => {
    return { path: domain + `/user-story/project/${projectId}/completion`, method: "GET" };
  },
  reorder_user_stories: { path: domain + `/user-story/reorder`, method: "PUT" },
  approve_user_story: (userStoryId) => {
    return { path: domain + `/user-story/${userStoryId}/approve`, method: "POST" };
  },
  advance_user_story_status: (userStoryId) => {
    return { path: domain + `/user-story/${userStoryId}/advance`, method: "POST" };
  },
  revert_user_story_status: (userStoryId) => {
    return { path: domain + `/user-story/${userStoryId}/revert`, method: "POST" };
  },
  request_story_change: (userStoryId) => {
    return { path: domain + `/user-story/${userStoryId}/change-request`, method: "POST" };
  },
  story_change_requests: (userStoryId) => {
    return { path: domain + `/user-story/${userStoryId}/change-requests`, method: "GET" };
  },
  review_change_request: (requestId) => {
    return { path: domain + `/user-story/change-request/${requestId}/review`, method: "PUT" };
  },
  pending_change_requests: { path: domain + `/user-story/change-requests/pending`, method: "GET" },
  start_timer: (userStoryId) => {
    return { path: domain + `/user-story/${userStoryId}/timer/start`, method: "POST" };
  },
  stop_timer: (userStoryId) => {
    return { path: domain + `/user-story/${userStoryId}/timer/stop`, method: "POST" };
  },
  current_timer: { path: domain + `/user-story/timer/current`, method: "GET" },

  // user story — helper stories
  create_helper_story: (userStoryId) => {
    return { path: domain + `/user-story/${userStoryId}/helper`, method: "POST" };
  },
  get_helper_stories: (userStoryId) => {
    return { path: domain + `/user-story/${userStoryId}/helper`, method: "GET" };
  },
  accept_reject_helper: (helperStoryId, action) => {
    return { path: domain + `/user-story/${helperStoryId}/helper/${action}`, method: "POST" };
  },
  help_requests: { path: domain + `/user-story/helper/requests`, method: "GET" },
  remove_helper_story: (helperStoryId) => {
    return { path: domain + `/user-story/${helperStoryId}/helper/remove`, method: "DELETE" };
  },

  // user story — dependencies
  story_dependencies: (userStoryId) => {
    return { path: domain + `/user-story/${userStoryId}/dependencies`, method: "GET" };
  },
  story_parents: (userStoryId) => {
    return { path: domain + `/user-story/${userStoryId}/parents`, method: "GET" };
  },
  add_story_dependency: (userStoryId, dependencyStoryId) => {
    return { path: domain + `/user-story/${userStoryId}/dependency/${dependencyStoryId}`, method: "POST" };
  },
  remove_story_dependency: (userStoryId, dependencyStoryId) => {
    return { path: domain + `/user-story/${userStoryId}/dependency/${dependencyStoryId}`, method: "DELETE" };
  },

  // project members
  project_members: (projectId) => {
    return { path: domain + `/project/member/${projectId}`, method: "GET" };
  },

  // issues
  issues: (projectId, issueId = null) => {
    return { path: domain + `/issue/project/${projectId}${issueId ? `/issue/${issueId}` : ""}`, method: "GET" };
  },
  issue_types: { path: domain + `/issue/types`, method: "GET" },
  issue_type_create: { path: domain + `/issue/type/create`, method: "POST" },
  create_issue: (projectId) => {
    return { path: domain + `/issue/${projectId}`, method: "POST" };
  },
  accept_issue: (issueId) => {
    return { path: domain + `/issue/${issueId}/accept`, method: "PUT" };
  },
  reject_issue: (issueId) => {
    return { path: domain + `/issue/${issueId}/reject`, method: "PUT" };
  },
  create_issue_task: (issueId) => {
    return { path: domain + `/issue/${issueId}/create-task`, method: "POST" };
  },
  issue_fixed: (issueId) => {
    return { path: domain + `/issue/${issueId}/resolve`, method: "PUT" };
  },
  issue_finilize: (issueId) => {
    return { path: domain + `/issue/${issueId}/finalize`, method: "PUT" };
  },
  issue_history: (issueId) => {
    return { path: domain + `/issue/${issueId}/history`, method: "GET" };
  },

  // task
  project_tasks: (projectId) => {
    return { path: domain + `/project/task/${projectId}`, method: "GET" };
  },
  create_task: (projectMemberId) => {
    return { path: domain + `/project/task/${projectMemberId}`, method: "POST" };
  },
  update_task: (taskId) => {
    return { path: domain + `/project/task/${taskId}`, method: "PUT" };
  },
  delete_task: (taskId) => {
    return { path: domain + `/project/task/${taskId}`, method: "DELETE" };
  },

  // helper task
  create_helper_task: (taskId) => {
    return { path: domain + `/project/helper-task/${taskId}`, method: "POST" };
  },
  assisted_tasks: (taskId) => {
    return { path: domain + `/project/task/${taskId}/assisted`, method: "GET" };
  },
  dependency_tasks: (taskId) => {
    return { path: domain + `/project/dependency-task/${taskId}`, method: "GET" };
  },
  parent_tasks: (taskId) => {
    return { path: domain + `/project/dependency-task/${taskId}/parent-task`, method: "GET" };
  },
  asked_help_tasks: { path: domain + `/project/helper-task/accept`, method: "GET" },
  accept_hekp_asked: (taskId, status) => {
    return { path: domain + `/project/helper-task/accept/${taskId}/${status}`, method: "POST" };
  },

  my_task: (type) => {
    return { path: domain + `/project/task/my-task/${type}`, method: "GET" };
  },
  create_self_task: (projectId) => {
    return { path: domain + `/project/task/self/${projectId}`, method: "POST" };
  },
  approve_task: (taskId) => {
    return { path: domain + `/project/task/${taskId}/approve`, method: "PUT" };
  },
  my_project_membership: (projectId) => {
    return { path: domain + `/project/member/my-membership/${projectId}`, method: "GET" };
  },
  start_task: (taskId) => {
    return { path: domain + `/work/${taskId}/start`, method: "POST" };
  },
  stop_task: { path: domain + `/work/end`, method: "Delete" },
  complete_task: (taskId) => {
    return { path: domain + `/project/task/${taskId}/complete`, method: "PUT" };
  },
  working_tasks: { path: domain + `/work/current`, method: "GET" },
  project_department_tasks: (projectId, departmentId) => {
    return { path: domain + `/project/task/${projectId}/${departmentId}`, method: "GET" };
  },
  available_checklist_tasks: { path: domain + `/project/task/available/checklist-tasks`, method: "GET" },
  assign_checklist_task: (taskId, projectMemberId) => {
    return { path: domain + `/project/task/${taskId}/${projectMemberId}`, method: "POST" };
  },
  add_dependency_task: (taskId, dependencyTaskId) => {
    return { path: domain + `/project/dependency-task/${dependencyTaskId}/${taskId}`, method: "POST" };
  },
  remove_dependency_task: (taskId, dependencyTaskId) => {
    return { path: domain + `/project/dependency-task/${dependencyTaskId}/${taskId}`, method: "DELETE" };
  },

  project_features: (projectId) => {
    return { path: domain + `/feature/project/${projectId}`, method: "GET" };
  },
  create_project_feature: (projectId) => {
    return { path: domain + `/feature/project/${projectId}`, method: "POST" };
  },

  // checklist
  checklist: (featureId) => {
    return { path: domain + `/check-list/feature/${featureId}`, method: "GET" };
  },
  checklist_delete: (id) => {
    return { path: domain + `/check-list/${id}`, method: "DELETE" };
  },
  checklist_create: (featureId) => {
    return { path: domain + `/check-list/feature/${featureId}`, method: "POST" };
  },
  checklist_update: (id) => {
    return { path: domain + `/check-list/${id}`, method: "PUT" };
  },

  // features
  department_features: (departmentId) => {
    return { path: domain + `/feature/department/${departmentId}`, method: "GET" };
  },
  department_features_not_in_project: (departmentId, projectId) => {
    return { path: domain + `/feature/department/${departmentId}/project/${projectId}`, method: "GET" };
  },
  add_feature_to_project: (departmentId) => {
    return { path: domain + `/feature/department/${departmentId}`, method: "POST" };
  },
  create_department_features: (departmentId) => {
    return { path: domain + `/feature/department/${departmentId}`, method: "POST" };
  },
  feature_detail: (id) => {
    return { path: domain + `/feature/${id}`, method: "GET" };
  },
  edit_feature_detail: (id) => {
    return { path: domain + `/feature/${id}`, method: "PUT" };
  },

  // projects
  // project_members: (id) => {
  //   return { path: domain + `/project/member/${id}`, method: "GET" };
  // },
  project_members_by_dept: (projectId, departmentId) => {
    return { path: domain + `/project/member/${projectId}/department/${departmentId}`, method: "GET" };
  },
  add_project_members: (projectId, departmentId) => {
    return { path: domain + `/project/member/${projectId}/department/${departmentId}`, method: "POST" };
  },
  delete_project_member: (memberId) => {
    return { path: domain + `/project/member/${memberId}`, method: "DELETE" };
  },
  update_project_member_role: (memberId) => {
    return { path: domain + `/project/member/${memberId}`, method: "PUT" };
  },
  search_project_member: (projectMemberId) => {
    return { path: domain + `/project/member/search/${projectMemberId}`, method: "GET" };
  },
  get_user_projects: { path: domain + `/project/usersongoing`, method: "GET" },
  get_department_projects: (departmentId) => {
    return { path: domain + `/project/usersongoing/department/${departmentId}`, method: "GET" };
  },
  completeProject: (projectId) => {
    return { path: domain + `/project/${projectId}/complete`, method: "POST" };
  },

  projects: (health = null) => {
    return { path: domain + `/project${health ? `/health/${health}` : ""}`, method: "GET" };
  },

  createProject: { path: domain + "/project/register", method: "POST" },
  update_project: (id) => {
    return { path: domain + `/project/${id}`, method: "PUT" };
  },
  project_detail: (id) => {
    return { path: domain + `/project/${id}`, method: "GET" };
  },
  delete_project: (id) => {
    return { path: domain + `/project/${id}`, method: "DELETE" };
  },

  login: { path: domain + "/auth/login", method: "POST" },
  register: { path: domain + "/auth/register", method: "POST" },
  forgot_password: { path: domain + "/auth/forgot-password", method: "POST" },
  logout: { path: domain + "/auth/logout", method: "DELETE" },
  change_forgot_password: { path: domain + "/auth/reset-forgot-password", method: "POST" },

  fetch_Sidebar: { path: domain + "/sidebar/get", method: "GET" },

  // check authenticated
  check_auth: { path: domain + "/auth/me", method: "GET" },

  // user
  update_profile: { path: domain + "/user/update-profile", method: "POST" },
  reset_password: { path: domain + "/user/reset-password", method: "POST" },
};

export default BACKEND_ENDPOINT;

export const paths = {
  dashboard: "/",

  // projects
  projects: (health = null) => `/projects${health ? `?health=${health}` : ""}`,
  projectDetail: (id = null) => {
    return { path: "/projects/:id", actualPath: `/projects/${id}` };
  },

  // features
  features: "/features",
  feature_detail: (id = null) => {
    return { path: "/feature/:id", actualPath: `/feature/${id}` };
  },

  // issues
  issues: "/issues",
  project_issues: (projectId = null) => {
    return { path: "/projects/:projectId/issues", actualPath: projectId ? `/projects/${projectId}/issues` : null };
  },
  issue_detail: (projectId = null, issueId = null) => {
    return { path: "/projects/:projectId/issues/:issueId", actualPath: projectId && issueId ? `/projects/${projectId}/issues/${issueId}` : null };
  },
  // sprints
  project_sprints: (projectId = null) => {
    return { path: "/projects/:projectId/sprints", actualPath: projectId ? `/projects/${projectId}/sprints` : null };
  },
  sprint_board: (projectId = null, sprintId = null) => {
    return { path: "/projects/:projectId/sprint/:sprintId/board", actualPath: projectId && sprintId ? `/projects/${projectId}/sprint/${sprintId}/board` : null };
  },
  project_board: (projectId = null) => {
    return { path: "/projects/:projectId/board", actualPath: projectId ? `/projects/${projectId}/board` : null };
  },

  // backlog
  project_backlog: (projectId = null) => {
    return { path: "/projects/:projectId/backlog", actualPath: projectId ? `/projects/${projectId}/backlog` : null };
  },

  // reports
  project_reports: (projectId = null) => {
    return { path: "/projects/:projectId/reports", actualPath: projectId ? `/projects/${projectId}/reports` : null };
  },

  // admin monitor (owner / admin only)
  admin_monitor: "/admin/monitor",

  // user stories
  user_stories: "/user-stories",
  user_story_detail: (id = null) => {
    return { path: "/user-story/:id", actualPath: `/user-story/${id}` };
  },

  invite_members: "/invite-members",

  // notifications
  notifications: "/notifications",

  // auths
  reset_password: "/reset-password",
  logout: "/logout",
  profile: "profile",
  login: "/login",
  auth_root: "/auth", // not acutal path root path for below paths
  register: "/auth/register",
  forgot_password: "/auth/forgot-password",
  change_forgot_password: "/auth/change-forgot-password/:token",

  // tools
  tools_root: "/tools", // not acutal path root path for below paths
  chart: "/tools/chart",
  contacts: "/tools/contacts",
  calendar: "/tools/calendar",

  // pages
  pages_root: "/pages", // not acutal path root path for below paths
  form: "/pages/form",
  faq: "/pages/faq",

  // pms
  department: "/department",
  organization: `/organization/${"f9552307-567a-4bae-9488-6b3203ec4982"}`,
};

// org id : 6ef09cad-8ced-46cf-83a9-249461ae547a
