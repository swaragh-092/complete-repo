# PMS v2 — Frontend Application

> Author: Gururaj  
> Version: 2.0.0  
> Created: 19th June 2025

React + Vite frontend for the **Project Management System v2**. It provides a full-featured project management UI including project dashboards, kanban boards, sprint planning, issue tracking, time logging, work reports, and admin monitoring — built on Material UI with Redux state management and React Query for server state.

---

## Table of Contents

- [PMS v2 — Frontend Application](#pms-v2--frontend-application)
  - [Table of Contents](#table-of-contents)
  - [Technology Stack](#technology-stack)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Install and run](#install-and-run)
    - [Build for production](#build-for-production)
  - [Environment Variables](#environment-variables)
  - [Architecture Overview](#architecture-overview)
  - [Pages \& Routes](#pages--routes)
  - [State Management](#state-management)
    - [Redux (persistent UI state)](#redux-persistent-ui-state)
    - [React Query (server state)](#react-query-server-state)
  - [API Communication](#api-communication)
  - [Authentication](#authentication)
  - [RBAC \& Permissions](#rbac--permissions)
  - [Code Standards](#code-standards)
  - [Related Documentation](#related-documentation)

---

## Technology Stack

| Layer            | Technology                      |
| ---------------- | ------------------------------- |
| Framework        | React 18                        |
| Build tool       | Vite                            |
| UI library       | Material UI (MUI) v6            |
| State management | Redux Toolkit                   |
| Server state     | TanStack React Query            |
| Routing          | React Router v6                 |
| Auth client      | `@spidy092/auth-client`         |
| HTTP client      | Fetch API via `util/request.js` |
| Notifications    | notistack                       |
| Charts           | recharts                        |
| Dev HTTPS        | vite-plugin-mkcert              |

---

## Project Structure

```
fn-pms-version-2/
├── index.html
├── vite.config.js              # HTTPS dev server at final-fn-pms.local.test:7000
├── src/
│   ├── main.jsx                # React root — mounts App with Redux Provider + AuthProvider
│   ├── App.jsx                 # Router definitions, theme, query client, org/workspace providers
│   │
│   ├── api/                    # Direct auth-client API helpers
│   │   ├── axios.js            # Axios instance with base auth headers
│   │   ├── organizations.js    # Organization management API calls
│   │   ├── roles.js            # RBAC role API calls
│   │   └── workspaces.js       # Workspace management API calls
│   │
│   ├── components/             # Shared/reusable UI components
│   │   ├── Header.jsx          # App top header bar
│   │   ├── Layout.jsx          # Authenticated layout wrapper (sidebar + content)
│   │   ├── Loading.jsx         # Full-screen loading spinner
│   │   ├── ProtectedLayout.jsx # Auth guard + session validity check
│   │   ├── WorkspaceSwitcher.jsx
│   │   ├── button/             # Reusable button variants
│   │   ├── feedback/           # AlertDialog, ConfirmDialog, ToastContainer
│   │   ├── form/               # DynamicForm builder
│   │   ├── formFields/         # InputField, SelectField, MultiSelectField, etc.
│   │   ├── organization/       # Org/workspace management modals
│   │   ├── pms/                # PMS-specific CreateDialog, EditDialog
│   │   ├── skeleton/           # Loading skeleton components
│   │   └── tools/              # ActionColumn, Datatable
│   │
│   ├── config/
│   │   └── authConfig.js       # Auth client configuration (org model, redirect URIs)
│   │
│   ├── constants/
│   │   └── permissions.js      # Permission key constants for RBAC checks
│   │
│   ├── context/
│   │   ├── OrganizationContext.jsx  # Current org + multi-org switching
│   │   └── WorkspaceContext.jsx     # Current workspace (tenant) context
│   │
│   ├── customHooks/
│   │   ├── useBackendRequest.jsx    # Hook wrapper around backendRequest()
│   │   └── useSidebar.jsx           # Sidebar open/close state
│   │
│   ├── features/               # Self-contained feature modules (React Query hooks + components)
│   │   ├── backlog/            # Backlog board (drag & drop issue prioritisation)
│   │   ├── boards/             # Board service API
│   │   ├── issues/             # Issue tracker (CRUD, Kanban, detail view)
│   │   ├── notifications/      # Notification dropdown + polling
│   │   ├── reports/            # Report charts (burndown, velocity, work logs)
│   │   └── sprints/            # Sprint management, sprint board, story assignment
│   │
│   ├── hooks/
│   │   ├── useClientRegistry.js  # SSO client registration hook
│   │   └── usePermissions.jsx    # Permission check hook (useHasPermission)
│   │
│   ├── pages/                  # Route-level page components
│   │   ├── Callback.jsx        # OAuth callback handler
│   │   ├── Dash.jsx            # Home / landing dashboard
│   │   ├── Login.jsx           # Login page (delegates to auth-client)
│   │   ├── Profile.jsx         # User profile page
│   │   ├── Settings.jsx        # Org settings, roles, members
│   │   ├── InviteMembers.jsx   # Invite team members
│   │   ├── SelectOrganization.jsx
│   │   ├── CreateOrganization.jsx
│   │   ├── OrganizationOnboarding.jsx
│   │   ├── error/              # Error boundary pages
│   │   ├── global/             # Sidebar, Topbar
│   │   └── pms/                # All PMS-domain pages
│   │       ├── admin/          # Admin monitoring + CSV/PDF export
│   │       ├── dashboard/      # Project health, executive snapshot, worker dashboard
│   │       ├── features/       # Feature list, feature detail, feature user stories
│   │       ├── issue/          # Issue list, issue history dialog, create dialog
│   │       ├── notification/   # Notification page
│   │       ├── projects/       # Project list, detail, features, members, tasks, sprints
│   │       ├── reports/        # Reports dashboard
│   │       └── userStories/    # User story list + detail
│   │
│   ├── services/
│   │   └── clientRegistryService.js  # Registers this app as SSO client
│   │
│   ├── store/                  # Redux Toolkit slices
│   │   ├── index.js            # Store configuration
│   │   ├── authSlice.js        # Current user state
│   │   └── notificationSlice.js # Unread notification count
│   │
│   ├── theme.js                # MUI theme + dark/light mode toggle
│   │
│   ├── util/
│   │   ├── urls.js             # All backend endpoint paths and route path helpers
│   │   ├── request.js          # Global fetch wrapper (adds auth token, handles 401)
│   │   ├── helper.js           # General utility functions
│   │   ├── validation.js       # Form validation helpers
│   │   └── feedback/
│   │       ├── ToastService.js     # Imperative toast notifications
│   │       ├── AlertService.js     # Imperative alert dialogs
│   │       └── ConfirmService.js   # Imperative confirm dialogs
│   │
│   └── utils/
│       └── cookieHelpers.js    # Cookie read/write utilities
│
├── public/                     # Static assets
├── sso-client.config.json      # SSO client registration config
└── rbac-definitions.sample.json # Sample RBAC permission definitions
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- PMS Backend (`../pms-version-2`) running
- Auth Service running

### Install and run

```bash
cd fn-pms-version-2
npm install
npm run dev
```

The app starts at **https://final-fn-pms.local.test:7000**.

> **Note:** The `local.test` domain requires a hosts file entry:  
> `127.0.0.1 final-fn-pms.local.test`  
> `vite-plugin-mkcert` automatically handles the self-signed HTTPS certificate.

### Build for production

```bash
npm run build
# Output: dist/
```

---

## Environment Variables

Create a `.env` file (copy from `.env.example`):

| Variable                  | Description                | Example                          |
| ------------------------- | -------------------------- | -------------------------------- |
| `VITE_AUTH_URL`           | Auth Service base URL      | `https://account.local.test`     |
| `VITE_PMS_API_URL`        | PMS API base URL           | `https://pms.local.test/pms_mod` |
| `VITE_ORGANIZATION_MODEL` | `multi` or `single`        | `multi`                          |
| `VITE_CLIENT_ID`          | SSO Client ID for this app | `fn-pms-v2`                      |

---

## Architecture Overview

```
React App
  ├── AuthProvider (@spidy092/auth-client)
  │     • Manages Keycloak token lifecycle
  │     • Provides useAuth() hook
  │
  ├── Redux Store
  │     • authSlice — current user
  │     • notificationSlice — unread count badge
  │
  ├── React Query (TanStack)
  │     • Server state for all API data
  │     • Automatic cache + background refetch
  │
  ├── OrganizationContext
  │     • Fetches & caches the user's organisations
  │     • Exposes currentOrganization + selectOrganization()
  │
  └── WorkspaceContext
        • Tracks the active workspace / tenant
```

All API data fetching is done through React Query hooks inside `features/*/hooks/` or directly in page components. The `backendRequest()` utility in `util/request.js` is the single HTTP function — it attaches the Bearer token, handles 401 redirects, and returns the parsed JSON envelope.

---

## Pages & Routes

| Path                                         | Component          | Description                                                         |
| -------------------------------------------- | ------------------ | ------------------------------------------------------------------- |
| `/`                                          | `Dash`             | Landing dashboard redirect                                          |
| `/projects`                                  | `ProjectDashboard` | Project list and portfolio overview                                 |
| `/project/:id`                               | `ProjectDetail`    | Tabs: Overview, Features, Members, Sprints, Board, Backlog, Reports |
| `/issues`                                    | `IssueList`        | Global issue list                                                   |
| `/project/:projectId/issues`                 | `IssueList`        | Project-scoped issue list                                           |
| `/issue/:issueId`                            | `IssueDetail`      | Issue detail: comments, attachments, sub-tasks, status              |
| `/project/:projectId/sprints`                | `SprintList`       | Sprint list for a project                                           |
| `/project/:projectId/sprint/:sprintId/board` | `SprintBoard`      | Sprint kanban board                                                 |
| `/project/:projectId/board`                  | `ProjectBoard`     | Full project kanban board                                           |
| `/project/:projectId/backlog`                | `BacklogBoard`     | Drag-and-drop backlog management                                    |
| `/project/:projectId/reports`                | `ReportsDashboard` | Burndown, velocity, work log, issue distribution                    |
| `/features`                                  | `FeaturesList`     | Global features/epics list                                          |
| `/feature/:featureId`                        | `FeatureDetail`    | Feature detail with linked user stories                             |
| `/user-stories`                              | `UserStoryList`    | Global user story list                                              |
| `/user-story/:userStoryId`                   | `UserStoryDetail`  | Story detail: tasks, timer, dependencies, change requests           |
| `/notifications`                             | `Notification`     | Notification centre                                                 |
| `/admin-monitor`                             | `AdminMonitor`     | Admin KPI dashboard with CSV/PDF export                             |
| `/profile`                                   | `Profile`          | User profile                                                        |
| `/settings`                                  | `Settings`         | Organisation settings, roles, members                               |

All routes inside `<ProtectedLayout>` require authentication. Unauthenticated users are redirected to `/login`.

---

## State Management

### Redux (persistent UI state)

| Slice               | State         | Description                         |
| ------------------- | ------------- | ----------------------------------- |
| `authSlice`         | `user`        | Currently authenticated user object |
| `notificationSlice` | `unreadCount` | Badge counter for notification bell |

### React Query (server state)

Each feature module exports custom hooks that wrap React Query's `useQuery` / `useMutation`:

```
features/issues/hooks/useIssues.js
  useIssue(issueId)
  useIssueTree(issueId)
  useComments(issueId)
  useChangeStatus()
  useAddComment()
  ...

features/sprints/hooks/useSprints.js
  useSprints(projectId)
  useCreateSprint()
  useStartSprint()
  ...
```

---

## API Communication

All backend calls go through `util/request.js`:

```js
import backendRequest from "./util/request";
import BACKEND_ENDPOINT from "./util/urls";

const result = await backendRequest({
  endpoint: BACKEND_ENDPOINT.user_story_detail(userStoryId),
  // Optional:
  bodyData: { ... },       // serialised as JSON body
  querySets: "?page=1",    // appended to URL
  organizationId: orgId,   // adds x-organization-id header
});
```

`util/urls.js` centralises every endpoint path as:

- A plain object `{ path, method }` for static endpoints
- A function returning `{ path, method }` for parametric endpoints

---

## Authentication

Authentication is handled by `@spidy092/auth-client`:

1. User visits app — `AuthProvider` checks session validity.
2. No valid session → redirect to `/login` (Keycloak login page via auth-service).
3. After login → Keycloak redirects to `/callback` with an auth code.
4. `Callback.jsx` exchanges the code for tokens via `auth.handleCallback()`.
5. Token is stored (localStorage / cookie) and `auth.getToken()` is used for every request.
6. Session expiry detected → redirect to `/login?expired=true`.

The `ProtectedLayout` component (and its inline version in `App.jsx`) gates all authenticated routes:

```jsx
const { loading, isAuthenticated, sessionValid } = useAuth();
if (!isAuthenticated) return <Navigate to="/login" />;
if (!sessionValid) return <Navigate to="/login?expired=true" />;
```

---

## RBAC & Permissions

Permission keys are defined in `src/constants/permissions.js`.  
The `usePermissions()` hook reads the current user's role set and exposes a `hasPermission(key)` helper.

Project-level roles are checked directly from `ProjectMember.project_role`:

- `lead` — full create/assign access within their department
- `member` — self-service only (take tasks, log time)
- `tester` — can create issues / bug reports
- `viewer` — read-only

---

## Code Standards

- **File headers** — every `.js` / `.jsx` file starts with:
  ```js
  // Author: Gururaj
  // Created: DD MMM YYYY
  // Description: …
  // Version: 1.0.0
  // Modified:
  ```
- **Component files** — one default export per file; named same as the component.
- **Feature modules** — each feature under `features/` exports its public API through an `index.js` barrel.
- **Feedback** — use `ToastService.showToast()`, `AlertService`, or `ConfirmService` (imperative) instead of inline state for notifications.
- **No inline `fetch`** — always use `backendRequest()` or the React Query hooks.

---

## Related Documentation

| Document              | Location                                                                           |
| --------------------- | ---------------------------------------------------------------------------------- |
| User Guide (end-user) | [`USER_GUIDE.md`](USER_GUIDE.md)                                                   |
| Frontend Architecture | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)                                     |
| Backend API           | [`../pms-version-2/docs/API_REFERENCE.md`](../pms-version-2/docs/API_REFERENCE.md) |
| Backend README        | [`../pms-version-2/README.md`](../pms-version-2/README.md)                         |
