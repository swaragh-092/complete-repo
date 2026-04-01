# PMS v2 Frontend — Architecture Guide

> Author: Gururaj  
> Version: 2.0.0  
> Last Updated: 1st April 2026

---

## Overview

The PMS v2 frontend is a Single-Page Application (SPA) built with React 18 and Vite. It communicates exclusively with the `pms-version-2` backend API and delegates all authentication to the centralised Auth Service via `@spidy092/auth-client`.

---

## Data Flow

```
User Interaction
      │
      ▼
React Component (page or feature component)
      │
      ├── React Query Hook (useQuery / useMutation)
      │         └── backendRequest({ endpoint, bodyData })
      │                   │
      │                   ├─ Attaches Authorization: Bearer <token>
      │                   └─ Fetches  https://pms.local.test/pms_mod/...
      │
      └── Redux Dispatch (for UI-global state like activeUser, unreadCount)
```

**Server state** (project data, issues, sprints, etc.) is managed exclusively by React Query.  
**UI state** (current user, notification badge) is managed by Redux.  
**Auth state** (`isAuthenticated`, `loading`, `sessionValid`, `user`) is managed by `@spidy092/auth-client`.

---

## Module: `features/`

Each subdirectory is a self-contained feature slice following the same pattern:

```
features/issues/
├── api/
│   └── issue.service.js       # Raw API call functions (called by hooks)
├── components/
│   ├── IssueDetail.jsx        # Issue detail panel with comments, attachments, sub-tasks
│   ├── IssueList.jsx          # Filterable issue table
│   ├── CreateIssueModal.jsx   # Modal form to create a new issue
│   └── KanbanBoard.jsx        # Kanban column layout
├── hooks/
│   └── useIssues.js           # React Query hooks (useIssue, useChangeStatus, etc.)
├── constants.js               # Priority colours, status maps, etc.
└── index.js                   # Public barrel export
```

External code only imports from `index.js`, never directly from `api/` or `components/`.

---

## Module: `pages/pms/`

Pages are route-level components. They compose `features/` modules and `components/` together:

```
pages/pms/
├── projects/
│   ├── ProjectList.jsx               # All projects grid
│   ├── ProjectDetail.jsx             # Tabs: Overview / Members / Features / Sprints
│   ├── features/
│   │   ├── ProjectFeatures.jsx       # Feature tree inside a project
│   │   └── AddFeatureDialog.jsx      # Create feature dialog
│   ├── members/
│   │   ├── ProjectMembersList.jsx    # Members table with role display
│   │   ├── AddMembersDialog.jsx      # Member selection dialog
│   │   └── EditMemberRoleDialog.jsx  # Change member project_role
│   ├── task/
│   │   ├── TaskPage.jsx              # Task management hub
│   │   ├── TaskList.jsx              # All tasks in a project
│   │   ├── MyTaskList.jsx            # Current user's active tasks
│   │   ├── CurrentTask.jsx           # Running task indicator + timer
│   │   ├── CreateHelperTask.jsx      # Request help from another member
│   │   ├── AcceptHelps.jsx           # Accept/reject incoming help requests
│   │   ├── DependencyTaskCreateDialog.jsx
│   │   ├── TaskDependenciesDialog.jsx
│   │   └── AssignChecklistTaskDialog.jsx
│   ├── overview/
│   │   ├── ProjectPortfolioOverview.jsx  # Admin cross-project view
│   │   └── MemberProjectOverview.jsx     # Member's own project summary
│   ├── userStories/
│   │   └── UserStoryCompletionWidget.jsx # Completion bar widget
│   └── logs/
│       └── ListLogs.jsx                  # Audit log viewer
│
├── features/
│   ├── FeaturesList.jsx           # Global features list across all projects
│   ├── FeatureDetialView.jsx      # Feature detail + linked user stories
│   ├── checklist/
│   │   └── ChecklistLists.jsx     # Feature checklist items
│   └── userStories/
│       └── FeatureUserStories.jsx # Stories scoped to a feature
│
├── userStories/
│   ├── UserStoryList.jsx          # Global stories list
│   └── UserStoryDetail.jsx        # Story detail: timeline, tasks, timer, dependencies
│
├── issue/
│   ├── IssueList.jsx              # Issue table (filterable, paginated)
│   ├── CreateIssueDialog.jsx      # Drawer/dialog to create an issue
│   └── IssueHistoryDialog.jsx     # Audit trail for an issue
│
├── dashboard/
│   ├── AdminDashboard.jsx         # Executive / admin analytics
│   ├── WorkerDashboard.jsx        # Member's personal dashboard
│   ├── ProjectHealthSummary.jsx   # Health indicators per project
│   ├── DeliveryRiskSnapshot.jsx   # At-risk projects widget
│   ├── ImmediateAttention.jsx     # Over-due items widget
│   ├── ExecutiveSnapshot.jsx      # KPI summary cards
│   ├── SummaryView.jsx            # Combined summary layout
│   ├── SummaryCard.jsx            # Generic metric card
│   └── QuickActionsPanel.jsx      # Shortcut action buttons
│
├── reports/
│   └── ReportsDashboard.jsx       # Report tabs host
│
├── admin/
│   ├── AdminMonitor.jsx           # Admin user/project KPI table
│   └── exportUtils.js             # CSV / PDF export helpers
│
└── notification/
    └── Notification.jsx           # Full notification list page
```

---

## Context Providers

### `OrganizationContext`

Fetches the user's organisations on mount (via Auth Service API).  
Exposes:

- `organizations` — array of all org objects
- `currentOrganization` — the active org
- `selectOrganization(org)` — switch active org (persisted to localStorage)

### `WorkspaceContext`

Tracks the active workspace / tenant within the current organisation.  
Exposes:

- `workspaces` — available workspaces
- `currentWorkspace` — active workspace
- `selectWorkspace(ws)` — switch active workspace

---

## Utility: `util/urls.js`

Single source of truth for every backend endpoint. Two forms:

```js
// Static (no parameters)
BACKEND_ENDPOINT.has_notifications  →  { path: ".../notification/unread-count", method: "GET" }

// Parametric (with parameters)
BACKEND_ENDPOINT.user_story_detail(id)  →  { path: ".../user-story/<id>", method: "GET" }
```

Route path helpers (for React Router `navigate()`):

```js
paths.projects()         →  "/projects"
paths.projectDetail(id)  →  { path: "/project/:id", url: "/project/<id>" }
paths.issue_detail(id)   →  { path: "/issue/:issueId", url: "/issue/<id>" }
```

---

## Utility: `util/request.js`

The single `backendRequest()` function:

1. Validates that `endpoint.path` and `endpoint.method` are present.
2. Gets the auth token via `auth.getToken()`.
3. Sets headers: `Content-Type: application/json`, `Authorization: Bearer <token>`, and optionally `x-organization-id`.
4. Sends `body` only for non-GET requests.
5. On HTTP 401, calls `navigate(paths.logout)` if a `navigate` function is provided.
6. Returns `{ ...responseBody, status, ok }`.

---

## Feedback System

Three imperative services for user feedback (no prop-drilling required):

| Service                                     | Usage                      | Component            |
| ------------------------------------------- | -------------------------- | -------------------- |
| `ToastService.showToast({ type, message })` | Non-blocking snack bar     | `ToastContainer.jsx` |
| `AlertService.show({ title, message })`     | Informational alert dialog | `AlertDialog.jsx`    |
| `ConfirmService.show({ title, message })`   | Awaitable confirm dialog   | `ConfirmDialog.jsx`  |

Each service uses a shared event bus pattern — the corresponding component is mounted once in `App.jsx` and subscribes to events.

---

## Theme

Defined in `src/theme.js`. Supports dark/light mode via `ColorModeContext`.  
`useMode()` returns `[theme, colorMode]`.  
`colorMode.toggleColorMode()` switches between dark and light.

---

## Performance Notes

- React Query: `refetchOnWindowFocus: false, retry: 1` globally — avoids unnecessary re-fetches.
- Loaders (`loader` prop on `<Route>`) are used for `ProjectDetail`, `FeatureDetail`, and `UserStoryDetail` to pre-fetch data before the component mounts.
- Heavy pages (reports, admin monitor) have their own isolated query keys to avoid cache collisions.

---

## Related Documents

- [`../README.md`](../README.md) — Frontend project overview and setup
- [`../USER_GUIDE.md`](../USER_GUIDE.md) — End-user guide
- [`../../pms-version-2/docs/API_REFERENCE.md`](../../pms-version-2/docs/API_REFERENCE.md) — Backend API reference
- [`../../pms-version-2/docs/ARCHITECTURE.md`](../../pms-version-2/docs/ARCHITECTURE.md) — Backend architecture
