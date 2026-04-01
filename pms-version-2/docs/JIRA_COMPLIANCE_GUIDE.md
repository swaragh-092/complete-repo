# Jira Compliance & Enterprise Features Guide

This document outlines the enterprise-standard features implemented in the Project Management System (PMS) v2, following Jira-like hierarchies and workflows.

## 1. Project Hierarchy

The system now supports a deep hierarchy for organizing work:

1.  **Project**: The top-level container.
2.  **Feature (Epic)**: Large bodies of work.
    - Can have **Sub-Features** (Nested Epics).
3.  **User Story**: Functional requirements (Standard Work Item).
    - Belongs to a Feature.
4.  **Task**: Technical work items (Standard Work Item).
    - Can be a sibling of User Story (under a Feature).
    - Can be a child of a User Story (Sub-task).
5.  **Issue**: Bugs/Defects.
    - Linked to User Stories.

## 2. Work Item Types

The `UserStory` entity has been enhanced to support multiple types of work.

### Fields

- `type`: `ENUM('story', 'task')`. Default is `'story'`.
- `reporter_id`: The user who created the item.
- `assigned_to`: The user responsible for the work.
- `priority`: `low`, `medium`, `high`, `critical`.
- `status`: `defined` -> `in_progress` -> `review` -> `completed`.
- `approval_status`: `not_required`, `pending`, `approved`, `rejected`.
- `approved_by`: The user who approved the work.

### Creating a Task

```json
POST /api/user-stories
{
  "project_id": "uuid",
  "feature_id": "uuid",
  "title": "Database Schema Update",
  "type": "task",
  "priority": "high"
}
```

### Creating a User Story

```json
POST /api/user-stories
{
  "project_id": "uuid",
  "feature_id": "uuid",
  "title": "As a user, I want to login",
  "type": "story",
  "acceptance_criteria": "..."
}
```

## 3. Workflow & Approvals

We enforce a strict workflow for quality assurance.

### State Transitions

1.  **Defined** -> **In Progress**: Work begins.
2.  **In Progress** -> **Review**: Work is done, requesting approval/review.
    - _Action_: System sets `approval_status` to `pending`.
    - _Notification_: Sent to Project Lead/Reviewers.
3.  **Review** -> **Completed**:
    - _Constraint_: Requires `approval_status` to be `'approved'` (or `'not_required'`).
    - _Error_: If you try to complete a story that is pending approval, the API returns 400.

### Approval Process

To approve a user story/task:

```json
POST /api/user-stories/:id/approve
{
  "status": "approved", // or "rejected"
  "comments": "Looks good"
}
```

- **Approved**: Status moves to `completed` automatically.
- **Rejected**: Status moves back to `in_progress`.

## 4. Notifications

The system generates notifications for:

- **Assignment**: When a user is assigned to a story/task.
- **Status Change**: When status moves to `review`, `completed`, etc.
- **Approvals**: When an item is approved or rejected.

Frontend should poll or listen to:
`GET /api/notifications`

## 5. Sub-Features

Features can now be nested.

### Creating a Sub-Feature

```json
POST /api/features
{
  "project_id": "uuid",
  "name": "Backend Refactoring",
  "parent_feature_id": "uuid-of-parent-feature"
}
```

### Fetching Feature Tree

`GET /api/features/:id` now includes:

- `subFeatures`: Array of child features.
- `parentFeature`: Reference to parent.

## 6. Integration Guide (Frontend)

### Dashboard

- Display "My Assigned Tasks" separately from "My Stories" if needed, or combined list with badges.
- Show "Pending Approval" items prominently for Leads.

### Kanban/Board

- Columns: `Defined`, `In Progress`, `Review`, `Completed`.
- Drag & Drop:
  - Dropping into `Review` requests approval.
  - Dropping into `Completed` checks verification.

### Forms

- **Create Feature**: Add "Parent Feature" dropdown (optional).
- **Create Item**: Add "Type" selector (Story vs Task).
