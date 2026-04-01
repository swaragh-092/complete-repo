# PMS v2 — Full API Reference

> Author: Gururaj  
> Version: 2.0.0  
> Last Updated: 1st April 2026

All endpoints are prefixed with `/{moduleCode}` where `moduleCode = pms_mod`.  
All requests must include a valid `access_token` cookie (or `Authorization: Bearer <token>` header).  
All responses follow the standard envelope:

```json
{
  "success": true | false,
  "status": 200,
  "message": "Human-readable message",
  "data": { ... } | [ ... ]
}
```

---

## Health

### `GET /health`

Returns service uptime and timestamp.

**Response**

```json
{ "status": "ok", "uptime": 123.45, "timestamp": 1711929600000 }
```

---

## Projects

### `POST /pms_mod/project`

Create a new project for the current organisation.

**Body**

```json
{
  "name": "Website Redesign",
  "code": "WR-2026",
  "description": "Full website redesign project",
  "estimatedStartDate": "2026-04-01",
  "estimatedEndDate": "2026-09-30"
}
```

---

### `GET /pms_mod/project`

List all projects for the organisation.

**Query params:** `status` (optional), `page`, `limit`, `search`

---

### `GET /pms_mod/project/overview`

Portfolio-level overview with project health, completion percentages, and member counts.

---

### `GET /pms_mod/project/member-dashboard`

Dashboard data for the currently authenticated member — their active tasks, stories, and project involvement.

---

### `GET /pms_mod/project/:id`

Get full project detail including metadata.

---

### `PUT /pms_mod/project/:id`

Update project fields (`name`, `code`, `description`, `estimatedStartDate`, `estimatedEndDate`).

---

### `DELETE /pms_mod/project/:id`

Soft-delete a project.

---

## Features (Epics)

Features are project-scoped in v2. They act as high-level epics that group user stories.

### `POST /pms_mod/feature/project/:projectId`

Create a feature under a project.

**Body**

```json
{
  "name": "User Authentication Module",
  "description": "All auth-related features",
  "departmentId": "<uuid>",
  "parentFeatureId": "<uuid | null>"
}
```

---

### `GET /pms_mod/feature/project/:projectId`

List all features belonging to a project.

---

### `GET /pms_mod/feature/:featureId`

Get feature detail including linked user stories.

---

### `PUT /pms_mod/feature/:featureId`

Update feature (`name`, `description`, `status`, `parentFeatureId`).

---

### `DELETE /pms_mod/feature/:featureId`

Soft-delete a feature.

---

## User Stories

### `POST /pms_mod/user-story/feature/:featureId`

Create a user story under a feature.

**Body**

```json
{
  "title": "As a user I can log in with SSO",
  "description": "...",
  "acceptance_criteria": "Given... When... Then...",
  "priority": "high",
  "story_points": 5,
  "due_date": "2026-05-01",
  "departmentId": "<uuid>",
  "projectId": "<uuid>",
  "parentUserStoryId": "<uuid | null>"
}
```

---

### `GET /pms_mod/user-story/:userStoryId`

Get user story with sub-stories, tasks, and issues.

---

### `PUT /pms_mod/user-story/:userStoryId`

Update user story fields.

---

### `DELETE /pms_mod/user-story/:userStoryId`

Soft-delete user story.

---

### `POST /pms_mod/user-story/:id/advance`

Advance the story's `live_status` through the workflow (`pending → in_progress → completed → approved`).

---

### `POST /pms_mod/user-story/:id/revert`

Revert the story status to the previous state.

---

### `POST /pms_mod/user-story/:id/approve`

Lead or manager approves the completed story.

---

### `POST /pms_mod/user-story/:id/timer/start`

Start a `WorkLog` timer for the current user on this story.

---

### `POST /pms_mod/user-story/:id/timer/stop`

Stop the active `WorkLog` timer.

---

### `GET /pms_mod/user-story/timer/current`

Get the currently running timer for the authenticated user.

---

### `POST /pms_mod/user-story/:id/change-request`

Submit a change request for a story (description/acceptance change).

**Body**

```json
{
  "requested_changes": "Acceptance criteria needs updating",
  "proposed_description": "..."
}
```

---

### `GET /pms_mod/user-story/:id/change-requests`

List all change requests for a story.

---

### `PUT /pms_mod/user-story/change-request/:requestId/review`

Approve or reject a change request.

**Body**

```json
{ "status": "approved" | "rejected", "reviewer_notes": "..." }
```

---

## Issues

Issues follow a Jira-style hierarchy configured via `IssueType` (`hierarchy_level` field).

### `POST /pms_mod/issue/project/:projectId`

Create an issue.

**Body**

```json
{
  "title": "Login button unresponsive on mobile",
  "description": "...",
  "priority": "high",
  "issue_type_id": "<uuid>",
  "user_story_id": "<uuid | null>",
  "parent_id": "<uuid | null>",
  "to_department_id": "<uuid>"
}
```

---

### `GET /pms_mod/issue/project/:projectId`

List issues for a project. Supports query filters: `status`, `priority`, `assignee`, `sprint_id`.

---

### `GET /pms_mod/issue/:id`

Get issue detail with comments, attachments, and child issues.

---

### `PUT /pms_mod/issue/:id`

Update issue (`title`, `description`, `priority`, `issue_type_id`, `to_department_id`).

---

### `PATCH /pms_mod/issue/:id/status`

Change the workflow status of an issue.

**Body**

```json
{ "status_id": "<uuid>" }
```

---

### `PATCH /pms_mod/issue/:id/assign`

Assign (or unassign) an issue.

**Body**

```json
{ "assignee_id": "<uuid | null>" }
```

---

### `POST /pms_mod/issue/:id/comment`

Add a comment.

**Body**

```json
{ "content": "This needs frontend changes too." }
```

---

### `PUT /pms_mod/issue/:id/comment/:commentId`

Edit a comment (author only).

---

### `DELETE /pms_mod/issue/:id/comment/:commentId`

Delete a comment (author only).

---

### `POST /pms_mod/issue/:id/attachment`

Upload a file attachment (multipart/form-data, field name: `file`, max 10 MB).

---

### `GET /pms_mod/issue/:id/attachments`

List attachments for an issue.

---

### `GET /pms_mod/issue/attachment/:attachmentId/download`

Download a file attachment.

---

### `DELETE /pms_mod/issue/attachment/:attachmentId`

Delete an attachment (owner only).

---

### `GET /pms_mod/issue/types`

List all issue types for the organisation (with hierarchy levels).

---

### `POST /pms_mod/issue/type/create`

Create a custom issue type.

**Body**

```json
{
  "name": "Epic",
  "color": "#6366F1",
  "hierarchy_level": 1,
  "description": "Top-level feature grouping"
}
```

---

## Workflow (Issue Statuses)

### `POST /pms_mod/issue/workflow/project/:projectId/status`

Create a workflow status column for a project.

**Body**

```json
{
  "name": "In Review",
  "category": "in_progress",
  "color": "#F59E0B",
  "position": 2
}
```

`category` must be `todo`, `in_progress`, or `done`.

---

### `GET /pms_mod/issue/workflow/project/:projectId`

Get all workflow statuses and allowed transitions for a project.

---

## Sprints

### `POST /pms_mod/sprint/project/:projectId`

Create a sprint.

**Body**

```json
{
  "name": "Sprint 3",
  "start_date": "2026-04-07",
  "end_date": "2026-04-18",
  "goal": "Complete auth module"
}
```

---

### `GET /pms_mod/sprint/project/:projectId`

List all sprints for a project.

---

### `PUT /pms_mod/sprint/:sprintId/start`

Start a sprint (sets `started_at`, moves status to `active`).

---

### `PUT /pms_mod/sprint/:sprintId/end`

End a sprint (moves incomplete issues to backlog or next sprint).

---

## Board

### `GET /pms_mod/board/project/:projectId`

Get the kanban board: workflow columns with their issues.

**Query:** `type=kanban` (default) or `type=sprint`

---

### `PUT /pms_mod/board/move`

Move an issue to a different status column.

**Body**

```json
{
  "issue_id": "<uuid>",
  "to_column_id": "<uuid>",
  "to_status_id": "<uuid>",
  "new_board_order": 1024.5
}
```

---

## Backlog

### `GET /pms_mod/backlog/project/:projectId`

List unassigned (backlog) issues for a project.

---

### `PUT /pms_mod/backlog/prioritize`

Re-order a backlog issue.

**Body**

```json
{ "issue_id": "<uuid>", "board_order": 512.25 }
```

---

### `PUT /pms_mod/backlog/move-to-sprint`

Assign a backlog issue to a sprint.

**Body**

```json
{ "issue_id": "<uuid>", "sprint_id": "<uuid>" }
```

---

## Project Members

### `POST /pms_mod/project/member/:projectId/department/:departmentId`

Add members to a project department.

**Body**

```json
{ "users": ["<userId1>", "<userId2>"] }
```

---

### `GET /pms_mod/project/member/:projectId/department/:departmentId`

Get members of a project within a department.

---

### `GET /pms_mod/project/member/:projectId`

Get all members across all departments.

---

### `PUT /pms_mod/project/member/:memberId/role`

Update a member's `project_role` (`member`, `lead`, `viewer`, `tester`).

---

### `DELETE /pms_mod/project/member/:memberId`

Remove a member from the project.

---

## Reports

### `GET /pms_mod/report/project/:projectId/distribution`

Issue distribution by status category.

---

### `GET /pms_mod/report/project/:projectId/velocity`

Sprint velocity chart data (completed story points per sprint).

**Query:** `limit=5` (default, number of sprints to include)

---

### `GET /pms_mod/report/project/:projectId/completion-rate`

Issue completion rate over time.

---

### `GET /pms_mod/report/project/:projectId/burndown/:sprintId`

Sprint burndown chart data.

---

### `GET /pms_mod/report/work-logs/overview`

Aggregated work-log summary across users.

**Query:** `start_date`, `end_date`, `user_id` (optional)

---

### `GET /pms_mod/report/work-logs/daily`

Per-day breakdown of work sessions.

**Query:** `start_date` (required), `end_date` (required), `user_id` (optional)

---

### `GET /pms_mod/report/work-logs/project/:projectId`

Work logs scoped to a single project.

---

### `GET /pms_mod/report/work-logs/department/:departmentId`

Work logs scoped to a department.

---

### `GET /pms_mod/report/admin/summary`

Admin KPI summary across all users.

**Query:** `start_date`, `end_date`

---

### `GET /pms_mod/report/admin/users`

Per-user work breakdown.

**Query:** `start_date`, `end_date`, `user_id` (optional)

---

### `GET /pms_mod/report/admin/projects`

Per-project completion stats.

**Query:** `start_date`, `end_date`, `project_id` (optional)

---

## Notifications

### `GET /pms_mod/notification`

List notifications for the current user.

**Query:** `page`, `limit`, `is_read` (boolean filter)

---

### `PUT /pms_mod/notification/:id`

Mark a notification as read.

---

### `GET /pms_mod/notification/unread-count`

Get the count of unread notifications.

---

## Unified Work Items

The `/work-items` endpoints provide a unified interface to create any type of work item (Epic, Story, Task, Bug) using a single endpoint by specifying `type`.

### `POST /pms_mod/work-items/project/:projectId`

**Body**

```json
{
  "type": "epic" | "story" | "task" | "bug" | "subtask",
  "title": "...",
  "description": "...",
  "project_id": "<uuid>",
  "department_id": "<uuid>",
  "parent_id": "<uuid | null>"
}
```

Internally:

- `epic` → creates a `Feature`
- `story` / `task` → creates a `UserStory`
- `bug` / `subtask` → creates an `Issue`

---

## Error Codes

| HTTP Status | Meaning                                                 |
| ----------- | ------------------------------------------------------- |
| `200`       | Success                                                 |
| `201`       | Resource created                                        |
| `400`       | Bad request — missing or invalid field                  |
| `401`       | Unauthorised — missing or invalid token                 |
| `403`       | Forbidden — insufficient role/permission                |
| `404`       | Resource not found                                      |
| `409`       | Conflict — duplicate or state violation                 |
| `422`       | Validation error — field-level errors in `errors` array |
| `500`       | Internal server error                                   |
