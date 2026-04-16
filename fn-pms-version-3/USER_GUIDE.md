# PMS v2 — Complete User Guide

> **Project Management System (PMS) Version 2**
> A full-featured project management tool supporting Features, User Stories, Sprints, Backlog, Kanban Board, Issues, Time Tracking, and Reports.

---

## Table of Contents

1. [Getting Started & Navigation](#1-getting-started--navigation)
2. [Projects](#2-projects)
3. [Project Features (Feature Tree)](#3-project-features-feature-tree)
4. [Features List & Feature Detail](#4-features-list--feature-detail)
5. [User Stories & Tasks](#5-user-stories--tasks)
6. [Time Tracking](#6-time-tracking)
7. [Helper Stories (Work Management)](#7-helper-stories-work-management)
8. [Story Dependencies](#8-story-dependencies)
9. [Backlog](#9-backlog)
10. [Sprints](#10-sprints)
11. [Board (Kanban)](#11-board-kanban)
12. [Issues (Bug Tracker)](#12-issues-bug-tracker)
13. [Reports & Analytics](#13-reports--analytics)
14. [Notifications](#14-notifications)
15. [Workflow & Roles](#15-workflow--roles)
16. [Glossary](#16-glossary)

---

## 1. Getting Started & Navigation

### Logging In

Access the system via the centralized login page. Your credentials are managed by the admin.

### Switching Workspaces

At the top of the sidebar, you can switch between **Workspaces** (organizations/tenants). Each workspace has its own isolated set of projects, features, users, and data.

### Sidebar Navigation

The main sidebar gives access to all modules:

| Menu Item         | What it does                                         |
| ----------------- | ---------------------------------------------------- |
| **Dashboard**     | Summary of projects, tasks, and activity             |
| **Projects**      | List and manage all projects                         |
| **Features**      | Browse features across projects                      |
| **User Stories**  | Browse all user stories you have access to           |
| **Issues**        | View issues (bugs, improvements) per project         |
| **Notifications** | Bell icon — real-time task and story activity alerts |

Within a project, the sidebar expands to show project-specific views:

- Project Detail → Features → User Stories → Sprints → Board → Backlog → Reports

---

## 2. Projects

### Viewing Projects

Go to **Projects → Project List** to see all projects you are a member of.

Each project card shows:

- Project name and description
- Your role in the project
- Department it belongs to

### Creating a Project _(Admin/Manager)_

1. Click **Create Project**.
2. Fill in: Name, Description, Department.
3. Click **Save**.

### Project Detail Page

Click any project card to open the **Project Detail** page. From here you can access:

- **Project Dashboard** — overview stats
- **Features** — the feature tree for this project
- **Members** — who is in the project and their roles
- **Sprints** — sprint list and management
- **Board** — Kanban view
- **Backlog** — unscheduled work
- **Reports** — charts and analytics

### Managing Project Members _(Admin/Manager)_

In the project, go to **Members**:

- **Add Member** — search by name/email and assign a department role.
- **Edit Role** — change a member's role (Admin, Manager, Developer, Viewer).
- **Remove Member** — revoke access.

---

## 3. Project Features (Feature Tree)

### What is a Feature?

A **Feature** is a high-level unit of work within a project (e.g., "User Authentication", "Payment Gateway"). Features can be nested: a Feature can have sub-features forming a tree structure.

### Viewing the Feature Tree

From the **Project Detail** page, click **Features** in the sidebar.

You will see:

- An **expandable tree** of all features in the project.
- Click the arrow icon (▶) to expand a feature and see its sub-features.
- Features are color-coded by status.

### Adding a Feature

1. Click **Add Feature** (top right).
2. Fill in: Name, Description, Status, Priority, Parent Feature (optional).
3. Click **Save**.
   To add a sub-feature, select the parent feature first, then click **Add Sub-Feature**.

### Feature Actions

From the tree, each feature row has action buttons:

- **View** — open the feature detail page.
- **Edit** — modify the feature fields.
- **Delete** — remove the feature and its sub-features.
- **Manage Features →** link at the bottom of the page takes you to the filterable Features List page.

---

## 4. Features List & Feature Detail

### Features List Page

This page shows all features for a project in a filterable, paginated table.

- Use the **project filter** at the top to select which project to view.
- Click any feature row to open the **Feature Detail View**.

### Feature Detail View

The Feature Detail page shows:

- Feature name, description, status, priority, assigned department.
- A list of **User Stories** (work items) under this feature.
- A **checklist** tab for granular tasks within the feature.

From here you can:

- **Add User Story** — create a new story or task under this feature.
- **View** individual stories — click a story row to open User Story Detail.

---

## 5. User Stories & Tasks

### What is a User Story?

A **User Story** represents a piece of work to be done (e.g., "As a user, I can reset my password"). Each story belongs to a **Feature** and can be broken into **Sub-Stories** or **Tasks**.

**Types:**

- **Story** — a functional requirement from the user's perspective.
- **Task** — a technical implementation step (sub-item of a story).

### Viewing User Stories

- **By Feature** — open a Feature Detail page and scroll to "User Stories".
- **By Project** — go to the Project sidebar → User Stories (shows all stories for the project).
- **Global View** — go to the main sidebar → User Stories (shows stories across all projects accessible to you).

### Creating a User Story

1. Navigate to a Feature Detail page.
2. Click **Add User Story**.
3. Fill in:
   - **Title** _(required)_ — short description.
   - **Description** — detailed context.
   - **Acceptance Criteria** — what "done" means.
   - **Type** — Story or Task.
   - **Priority** — Critical / High / Medium / Low.
   - **Assign To** — select a project member.
   - **Story Points** — estimation (1–100).
   - **Due Date** — target completion date.
4. Click **Save**.

### User Story Detail Page

Click any story row to open its detail page. You will see:

**Header badges:**

- Type, Priority, Status, Approval Status, Story Points, Due Date
- **Time Logged** — total time recorded on this story (shown in `Xh Ym` format).
- Timer badge turns green when the timer is running.

**Action buttons (top right):**

- **Start Timer** / **Stop Timer** — start or stop time tracking.
- **Approve & Complete** / **Reject** — shown when status is `review` (for reviewers/managers).
- **Edit** — modify the story fields.

**Sub Items & Tasks section:**

- Shows all sub-stories and tasks linked to this story.
- Each sub-row shows: Type, Title, Priority, Status, Assigned To, Points, Timer status.
- Click **Add Sub Item** to create a child story or task.

### User Story Statuses

| Status        | Meaning                                     |
| ------------- | ------------------------------------------- |
| `defined`     | Work item created, not yet started          |
| `in_progress` | Work has begun (auto-set when timer starts) |
| `review`      | Developer has submitted for review          |
| `completed`   | Approved and closed                         |
| `blocked`     | Cannot proceed (dependency or blocker)      |

### Editing a User Story

Click **Edit** on the detail page to open the edit dialog. You can update:

- Title, Description, Acceptance Criteria, Type, Priority, Assign To, Status, Story Points, Due Date.

### Approval Workflow

When a developer sets a story to `review`, a manager or approver can:

- **Approve & Complete** → status changes to `completed`.
- **Reject** → status reverts to `in_progress`.
  A notification is sent to the assigned user when the story is approved or rejected.

---

## 6. Time Tracking

### Overview

PMS v2 includes a built-in time tracker for user stories and tasks. You can track exactly how long you spend on each work item.

> **Note:** Only one timer can run at a time per user. Starting a new timer on another story automatically stops any previously running timer.

### Starting a Timer

1. Open any **User Story Detail** page.
2. Click the green **Start Timer** button in the top-right header.
3. The button changes to a red **Stop (Xs / Ym / Xh)** button showing elapsed time live.
4. The story status automatically advances from `defined` → `in_progress` when you start the timer.

### Stopping a Timer

1. Click the red **Stop** button to stop timing.
2. The elapsed time is added to the **Time Logged** total.
3. The "Time Logged" chip in the header updates to show the new cumulative total.

### Viewing Total Work Time

The **Time Logged** chip in the story header always shows the cumulative recorded time for that story (e.g., `2h 35m`).

In the Sub Items table, a **Timer** column shows a green "Running" badge if a sub-story/task is currently being timed.

### Auto-Stop at End of Day

Every day at **9:00 PM IST**, the system automatically stops all running timers. This ensures no accidental overnight timer accumulation. The time logged up to that point is saved.

---

## 7. Helper Stories (Work Management)

### What is a Helper Story?

A **Helper Story** is a dedicated work item created when a team member needs assistance on a user story. It is assigned to a **different** person and follows an accept/reject workflow before work begins.

This allows distributed collaboration: one developer owns the primary story while another contributes focused help — with full visibility of who is helping, what they are doing, and in what state.

> **Key difference from a Sub-Item:** A Sub-Item is a breakdown of the parent. A Helper Story is an _additional contributor_ — it lives at the top level but is logically linked to the parent story.

### Helper Story Statuses

| Status           | Meaning                                                   |
| ---------------- | --------------------------------------------------------- |
| `accept_pending` | Help requested, waiting for the assigned person to accept |
| `in_progress`    | Helper accepted — they are actively working               |
| `reject`         | Helper declined the request                               |
| `completed`      | Helper work is done                                       |

### Requesting Help on a Story

1. Open the **User Story Detail** page.
2. Scroll to the **Helper Stories** section.
3. Click **Request Help**.
4. Fill in the dialog:
   - **Title** _(required)_ — describe what help is needed.
   - **Assign To** — select the team member to ask for help _(must be different from the parent story's assignee)_.
   - **Description** — optional details about the help required.
   - **Due Date** — optional target date.
5. Click **Save**.

The assigned person receives a **notification** that help has been requested. The helper story appears in the **Helper Stories** section with status `accept_pending`.

### Accepting or Rejecting a Help Request

If you are assigned a helper story:

1. Open the **User Story Detail** page of the parent story (shown in your notification).
2. In the **Helper Stories** section, you will see the pending request with **Accept** and **Reject** buttons.
3. Click **Accept** → the helper story status changes to `in_progress` and you can start working.
4. Click **Reject** → the helper story is marked `reject` and the requester is notified.

### Working on a Helper Story

Once accepted, the helper story behaves like any normal user story:

- Use **Start Timer** / **Stop Timer** to track your time.
- Update the status as you progress.
- Set to `review` when done so the requester can approve.

### Removing a Helper Story

Click **Remove** next to any helper story in the list. This soft-deletes the helper story. Only the person who created the request (reporter) can remove it.

### Helper Story Rules

- The helper's assignee **must** be different from the parent story's assignee.
- A helper story cannot be created for an already `completed` parent story.
- All helper stories are listed on the parent story's detail page for full visibility.

---

## 8. Story Dependencies

### What is a Story Dependency?

A **Story Dependency** is a link between two user stories indicating that **Story A should be completed before Story B can proceed**. Dependencies are informational — they help with planning and visibility but do not technically block the workflow.

Use dependencies to:

- Communicate ordering requirements to the team.
- Spot potential blockers early during sprint planning.
- Track which stories are waiting on others.

### Types of Dependency Views

| View           | Meaning                                                        |
| -------------- | -------------------------------------------------------------- |
| **Blocked by** | Stories _this_ story depends on — must be done first.          |
| **Blocking**   | Stories that depend on _this_ story — they are waiting on you. |

### Adding a Dependency

1. Open the **User Story Detail** page.
2. Scroll to the **Story Dependencies** section.
3. In the search field, type a story title to find it (all stories in the project are searchable).
4. Select the story from the dropdown.
5. Click **Add Dependency**.

The selected story now appears under **Blocked by** — meaning the current story depends on it.

### Removing a Dependency

In the **Blocked by** list, click **Remove** next to the dependency you want to unlink.

### Viewing What This Story Blocks

The **Blocking** section shows all stories that depend on the current story. These stories are waiting for you to finish. This section is read-only — the dependency was added from those other stories.

### Dependency Rules

- A story **cannot depend on itself**.
- **Circular dependencies are prevented** — if Story B already depends on Story A, you cannot make Story A also depend on Story B.
- Duplicate links are prevented (same pair cannot be added twice).

### Using Dependencies for Planning

```
Example:
  Story: "Set up database schema"        ← no dependencies
       ↑ blocked by
  Story: "Build user registration API"    ← depends on schema story
       ↑ blocked by
  Story: "Build registration UI"          ← depends on API story
```

During sprint planning, identify the dependency chain and ensure blocked stories are only pulled into a sprint once their blockers are complete.

---

## 9. Backlog

### What is the Backlog?

The **Backlog** is a prioritized list of all work items (issues) that are not yet assigned to a sprint. Think of it as the "queue" of things to do.

### Accessing the Backlog

From the Project sidebar, click **Backlog**.

### Backlog Layout

The page shows:

- **Sprint sections** (collapsed/expanded accordions) — each active or planned sprint with its assigned issues.
- **Backlog section** at the bottom — unassigned issues.

### Managing the Backlog

**Reorder issues:** Drag and drop issues within the Backlog section to change their priority order.

**Move issue to Sprint:** Drag an issue from the Backlog into a Sprint section, OR right-click (or use the action menu) → **Move to Sprint** → select the sprint.

**Create new issue:** Click **+ Create Issue** at the top of the Backlog section.

---

## 10. Sprints

### What is a Sprint?

A **Sprint** is a fixed-length development cycle (typically 1–4 weeks) containing a defined set of issues to complete.

### Viewing Sprints

From the Project sidebar, click **Sprints**. You'll see a list of all sprints:

- **Planned** — not yet started.
- **Active** — currently in progress (only one at a time).
- **Completed** — finished sprints.

### Creating a Sprint _(Manager/Admin)_

1. Click **Create Sprint**.
2. Fill in:
   - **Name** — e.g., "Sprint 1", "October Cycle".
   - **Goal** — what the sprint is trying to achieve.
   - **Start Date** and **End Date**.
3. Click **Create**.

### Starting a Sprint _(Manager/Admin)_

Click **Start Sprint** on a planned sprint. The sprint status changes to **Active**. Only one sprint can be active at a time per project.

### Ending a Sprint _(Manager/Admin)_

Click **End Sprint** on the active sprint. Incomplete issues are **moved back to the Backlog** automatically. The sprint is marked **Completed**.

### Sprint Board

Click **View Board** on any active sprint to open the **Sprint Board** — a Kanban view filtered to that sprint's issues only. Drag issues between columns to update their status.

### Adding Issues to a Sprint

- From the Backlog page: drag issues into the sprint.
- From the Sprint detail: click **Add Issues** → select from the project backlog.

---

## 11. Board (Kanban)

### What is the Board?

The **Board** provides a Kanban-style visual view of all issues in a project, organized by status columns.

### Accessing the Board

From the Project sidebar, click **Board**.

### Board Layout

Issues are displayed as cards in columns. Each column represents a workflow status (e.g., "To Do", "In Progress", "In Review", "Done").

### Moving Issues

**Drag and drop** issue cards between columns to change their status. The system records the status change in the issue history automatically.

### Issue Cards

Each card shows:

- Issue title and issue number.
- Priority badge (color-coded).
- Assignee avatar or name.
- Story points (if linked to a user story).

### Creating an Issue from the Board

Click **+ Create Issue** in any column header to create a new issue directly in that status.

### Sprint Board vs. Project Board

- **Project Board** (sidebar → Board) — shows **all** project issues.
- **Sprint Board** (sidebar → Sprints → View Board) — shows only issues in that specific sprint.

---

## 12. Issues (Bug Tracker)

### What is an Issue?

An **Issue** is a trackable work item in the project — typically a bug, task, or improvement found during testing. Issues **must belong to a User Story** so that responsibility is clearly traceable. If the correct User Story is not yet known at the time of raising the issue, a **Team Lead** can link it later.

> Issues are **not** directly assigned to individual people. Instead, they are linked to a User Story, and the person responsible for that story takes ownership.

---

### Who Can Create Issues?

Access to the Issues section is **permission-controlled** based on your project role:

| Project Role | Can View Issues | Can Create Issues | Can Link to User Story |
|---|---|---|---|
| `viewer` | ✅ | ❌ | ❌ |
| `member` | ✅ | ❌ | ❌ |
| `tester` | ✅ | ✅ | ❌ |
| `lead` (Team Lead) | ✅ | ✅ | ✅ |

> The **Create Issue** button is only visible to users with the `tester` or `lead` role in the project.

---

### Viewing Issues

From the Project sidebar, click **Issues**.

You'll see a list of issues filterable by status, priority, type, and user story.

---

### Creating an Issue

1. Click **Create Issue** _(only visible to testers and team leads)_.
2. Fill in:
   - **Title** _(required)_.
   - **Description**.
   - **Type** — select or create an issue type (e.g. Bug, Improvement, Task).
   - **Priority** — Critical / High / Medium / Low.
   - **Link to User Story** _(optional)_ — if you know which user story this issue belongs to, select it. Otherwise leave it blank — a team lead will link it.
3. Click **Create**.

> **Note:** No individual assignee is set at creation. Responsibility flows from the linked User Story.

---

### Linking an Issue to a User Story (Team Lead)

After an issue is created, a **Team Lead** can link or change the User Story from the Issue Detail page:

1. Open the issue.
2. In the **Details** sidebar, find the **User Story** section.
3. Select the correct User Story from the dropdown.
4. The change is saved immediately and logged in Issue History.

> Only users with the `lead` role can change the User Story link. All other roles see the linked story as read-only.

---

### Issue Detail Page

Click any issue to open the detail page. You can:

- **Change Status** — use the status dropdown (or drag card on the Board).
- **Link to User Story** — team leads can assign or reassign the user story.
- **Add Comment** — collaborate with team members.
- **Attach Files** — upload screenshots, logs, etc.
- **View Sub-tasks** — see any child issues in the hierarchy tree.
- **View History** — see a full audit trail of all changes.

---

### Issue Statuses

Issues use **custom workflow statuses** defined per project (categories: `todo`, `in_progress`, `done`). The exact status names depend on your project configuration.

---

### Issue History

Every change to an issue is logged: status changes, user story links, comments, attachments. Click **View History** to see the full audit trail.

---

## 13. Reports & Analytics

### Accessing Reports

From the Project sidebar, click **Reports**.

### Available Charts

#### Issue Distribution (Donut/Pie Chart)

Shows how issues are distributed by status for the entire project.

- Helps identify bottlenecks (too many issues "In Progress" or "Blocked").
- Color-coded by status category (todo = grey, in_progress = blue, done = green).

#### Velocity Chart (Bar Chart)

Shows the **planned vs. completed story points** for the last 5 sprints.

- **Blue bars** = total committed points at sprint start.
- **Green bars** = actually completed points.
- Use this to understand your team's delivery consistency (velocity).
- Good velocity = bars are close in height and stable sprint-over-sprint.

#### Sprint Burndown Chart (Line Chart)

Shows the **remaining work** in the currently selected sprint over time.

- **Grey dashed line** = ideal burndown (how you should be burning through points if work progresses evenly).
- **Blue solid line** = actual remaining points each day.
- **Below ideal line** = ahead of schedule.
- **Above ideal line** = at risk of not finishing the sprint.

**How to use:** Select a sprint from the dropdown at the top of the page to view its burndown chart. Future days are shown as empty (no actual data yet).

#### Reading the Burndown Chart

```
Points
  |
50|.....          ← Sprint starts with 50 points
  |     .....     ← Ideal: 50/10 days = 5 points/day
  |          .... ← Ideal reaches 0 by sprint end
  |_____________________ Time (Days)
```

If the actual line is flat (not going down), the team is not completing work fast enough.

---

## 14. Notifications

### Receiving Notifications

The bell icon (🔔) in the top navigation bar shows your unread notification count.

### Types of Notifications

You receive notifications when:

- A **user story is assigned to you**.
- A story you own is **approved** or **rejected**.
- A story is **updated** (status change, reassignment).

### Viewing Notifications

Click the bell icon to see a dropdown with recent notifications. Each notification shows:

- The action taken.
- Which story/task was affected.
- When it happened.

### Marking as Read

Click any notification to mark it as read. The unread count in the badge decreases.

---

## 15. Workflow & Roles

### Project Roles

| Role          | Capabilities                                                      |
| ------------- | ----------------------------------------------------------------- |
| **Admin**     | Full access: create/delete anything, manage members               |
| **Manager**   | Create projects, sprints; approve user stories; manage backlog    |
| **Developer** | Create/update user stories and issues; log time; move board cards |
| **Viewer**    | Read-only access to all project content                           |

### End-to-End Workflow

```
Project Created
       ↓
Features defined (Feature Tree)
       ↓
User Stories created under Features
       ↓
Story Dependencies added (identify blockers/order)
       ↓
Helper Stories requested (for collaborative work)
       ↓
Issues linked to User Stories (or standalone)
       ↓
Issues added to Backlog, prioritized by drag-and-drop
       ↓
Sprint created with Goal + Dates
       ↓
Issues moved from Backlog → Sprint
       ↓
Sprint Started → Team works on Sprint Board
       ↓
Developers: log time, update status, move cards
       ↓
Stories reach "review" → Manager approves/rejects
       ↓
Sprint Ended → incomplete issues return to Backlog
       ↓
Reports reviewed for velocity and burndown insights
```

### Typical Daily Workflow for a Developer

1. Open **My Tasks** or navigate to the project **Board**.
2. Pick the next issue / user story to work on.
3. Open the **User Story Detail** and click **Start Timer**.
4. Work on the task throughout the day.
5. Update the status (e.g., move to "In Progress" on the board).
6. When done, set status to **Review** and click **Stop Timer**.
7. Manager reviews → Approves → Status becomes Completed.

### Typical Workflow for a Manager

1. Create **Features** in the project.
2. Create **User Stories** under features and assign priorities/points.
3. Review the **Backlog** and prioritize issues.
4. Create a **Sprint** with a goal and dates.
5. Move issues from Backlog into the Sprint.
6. Click **Start Sprint**.
7. Monitor progress via the **Board** and **Reports**.
8. Approve or reject stories in **Review** status.
9. Click **End Sprint** when the sprint period is over.
10. Review **Velocity** and **Burndown** charts to plan the next sprint.

---

## 16. Glossary

| Term              | Definition                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------- |
| **Workspace**     | An isolated organization/tenant environment. All data is scoped to the workspace.         |
| **Project**       | A container for features, user stories, issues, sprints, and boards.                      |
| **Feature**       | A high-level grouping of work items (can be nested as sub-features).                      |
| **User Story**    | A functional requirement described from the user's perspective; the primary work unit.    |
| **Task**          | A technical sub-item under a user story; implementation details.                          |
| **Sub-Story**     | A child user story, typically a finer breakdown of the parent story.                      |
| **Issue**         | A bug, improvement, or task tracked in the issue tracker; can be linked to a user story.  |
| **Sprint**        | A fixed time-boxed development cycle, typically 1–4 weeks.                                |
| **Backlog**       | The prioritized queue of all issues not yet assigned to a sprint.                         |
| **Board**         | A Kanban-style view of issues organized by status in columns.                             |
| **Story Points**  | An estimation unit for the complexity/effort of a user story (not time-based).            |
| **Velocity**      | Average story points completed per sprint; measures team throughput.                      |
| **Burndown**      | A chart showing remaining work in a sprint over time vs. ideal progress.                  |
| **Time Tracking** | Start/stop timer to record actual time spent on a user story or task.                     |
| **live_status**   | Timer state: `running` (timer active) or `stop` (timer paused/stopped).                   |
| **Approval Flow** | Workflow where a story must be reviewed (approved/rejected) before being marked complete. |
| **Department**    | Organizational unit; users and projects are associated with departments.                  |

---

## Quick Reference Card

### Key Shortcuts & Flows

| Goal                       | Steps                                                 |
| -------------------------- | ----------------------------------------------------- |
| Start working on a story   | Open Story Detail → Click **Start Timer**             |
| Mark work done for review  | Edit Story → Set Status = `review`                    |
| Move issue on board        | Drag card to target column on Board page              |
| Add an issue to a sprint   | Backlog page → Drag issue into sprint section         |
| Start a sprint             | Sprints page → Click **Start Sprint**                 |
| View team velocity         | Reports page → Velocity Chart                         |
| Track sprint pace          | Reports page → Burndown Chart → Select Sprint         |
| Approve a story            | Story Detail → Click **Approve & Complete**           |
| See who is working on what | Board page (cards show assignee) or User Stories list |
| Record a bug               | Issues → Create Issue → Type = Bug                    |

---

_Document version: 1.0 | System version: PMS v2.0 | Last updated: March 2026_
