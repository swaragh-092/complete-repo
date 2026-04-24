// Author: Gururaj
// Created: 19th Jun 2025
// Description: Root application component with React Router, Redux, Theme, Auth, Org, and Workspace providers.
// Version: 1.0.0
// Modified:

import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Navigate, Outlet } from "react-router-dom";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { lazy, Suspense, useEffect } from "react";
import { useDispatch } from "react-redux";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { auth, AuthProvider, useAuth } from "@spidy092/auth-client";

import { ColorModeContext, useMode } from "./theme";
import BACKEND_ENDPOINT, { paths } from "./util/urls";
import backendRequest from "./util/request";
import { setNotificationCount } from "./store/notificationSlice";

import Layout from "./components/Layout";
import ErrorComponent from "./pages/error/Error";
import ToastContainer from "./components/feedback/ToastContainer";
import AlertDialog from "./components/feedback/AlertDialog";
import ConfirmDialog from "./components/feedback/ConfirmDialog";
import ActiveTimerWidget from "./components/pms/ActiveTimerWidget";

// ─── Loaders (eager — required at router init time) ──────────────────────────
import { projectFetchLoader } from "./pages/pms/projects/ProjectDetail";
import { featureFetchLoader } from "./pages/pms/features/FeatureDetialView";
import { userStoryFetchLoader } from "./pages/pms/userStories/UserStoryDetail";
import { pageFetchLoader } from "./pages/pms/site/pages/PageDetailView";
import { componentFetchLoader } from "./pages/pms/site/components/ComponentDetail";

// ─── Page components (lazy — code-split into separate chunks) ─────────────────
const Dash = lazy(() => import("./pages/Dash"));
const ProjectDashboard = lazy(() => import("./pages/pms/projects/ProjectDashboard"));
const ProjectDetailView = lazy(() => import("./pages/pms/projects/ProjectDetail"));
const FeaturesList = lazy(() => import("./pages/pms/features/FeaturesList"));
const FeatureDetail = lazy(() => import("./pages/pms/features/FeatureDetialView"));
const Issue = lazy(() => import("./pages/pms/issue/IssueList"));
const IssueDetail = lazy(() =>
  import("./features/issues").then((m) => ({ default: m.IssueDetail })),
);
const SprintList = lazy(() =>
  import("./features/sprints").then((m) => ({ default: m.SprintList })),
);
const SprintBoard = lazy(() =>
  import("./features/sprints").then((m) => ({ default: m.SprintBoard })),
);
const ProjectBoard = lazy(() =>
  import("./features/sprints").then((m) => ({ default: m.ProjectBoard })),
);
const BacklogBoard = lazy(() =>
  import("./features/backlog").then((m) => ({ default: m.BacklogBoard })),
);
const ReportsDashboard = lazy(() => import("./pages/pms/reports/ReportsDashboard"));
const AdminMonitor = lazy(() => import("./pages/pms/admin/AdminMonitor"));
const UserStoryList = lazy(() => import("./pages/pms/userStories/UserStoryList"));
const UserStoryDetail = lazy(() => import("./pages/pms/userStories/UserStoryDetail"));
const Notification = lazy(() => import("./pages/pms/notification/Notification"));

// ─── Site project type pages ──────────────────────────────────────────────────
const PagesList = lazy(() => import("./pages/pms/site/pages/PagesList"));
const PageDetailView = lazy(() => import("./pages/pms/site/pages/PageDetailView"));
const ComponentDetail = lazy(() => import("./pages/pms/site/components/ComponentDetail"));
const Login = lazy(() => import("./pages/Login"));
const Callback = lazy(() => import("./pages/Callback"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const InviteMembers = lazy(() => import("./pages/InviteMembers"));
const SelectOrganization = lazy(() => import("./pages/SelectOrganization"));
const CreateOrganization = lazy(() => import("./pages/CreateOrganization"));

import { OrganizationProvider } from "./context/OrganizationContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { setUser } from "./store/authSlice";

/* ─── Page-level Suspense fallback ──────────────────────────────────────────── */

function PageFallback() {
  return (
    <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
      Loading...
    </div>
  );
}

/* ---------------------- React Query ---------------------- */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

/* ---------------------- Auth Guard ---------------------- */

function ProtectedLayout() {
  const { loading, isAuthenticated, sessionValid } = useAuth();

  if (loading) {
    return <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!sessionValid) {
    return <Navigate to="/login?expired=true" replace />;
  }

  return <Layout />;
}

/** Protected but without sidebar/topbar — for org-selection & org-creation */
function ProtectedFullPage() {
  const { loading, isAuthenticated, sessionValid } = useAuth();

  if (loading) {
    return <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!sessionValid) {
    return <Navigate to="/login?expired=true" replace />;
  }

  return <Outlet />;
}

/* ---------------------- Router ---------------------- */

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<ProtectedLayout />} errorElement={<ErrorComponent />}>
        <Route index element={<Dash />} />

        <Route path={paths.projects()} element={<ProjectDashboard />} />
        <Route path={paths.projectDetail().path} element={<ProjectDetailView />} loader={projectFetchLoader} />

        <Route path={paths.issues} element={<Issue />} />
        <Route path={paths.project_issues().path} element={<Issue />} />
        <Route path={paths.issue_detail().path} element={<IssueDetail />} />

        <Route path={paths.project_sprints().path} element={<SprintList />} />
        <Route path={paths.sprint_board().path} element={<SprintBoard />} />
        <Route path={paths.project_board().path} element={<ProjectBoard />} />
        <Route path={paths.project_backlog().path} element={<BacklogBoard />} />
        <Route path={paths.project_reports().path} element={<ReportsDashboard />} />

        <Route path={paths.admin_monitor} element={<AdminMonitor />} />

        <Route path={paths.notifications} element={<Notification />} />
        <Route path={paths.features} element={<FeaturesList />} />
        <Route path={paths.feature_detail().path} element={<FeatureDetail />} loader={featureFetchLoader} />
        <Route path={paths.user_stories} element={<UserStoryList />} />
        <Route path={paths.user_story_detail().path} element={<UserStoryDetail />} loader={userStoryFetchLoader} />

        {/* Site project type */}
        <Route path={paths.pages} element={<PagesList />} />
        <Route path={paths.page_detail().path} element={<PageDetailView />} loader={pageFetchLoader} />
        <Route path={paths.component_detail().path} element={<ComponentDetail />} loader={componentFetchLoader} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/invite-members" element={<InviteMembers />} />
      </Route>

      {/* Org onboarding — authenticated but NO sidebar/topbar */}
      <Route element={<ProtectedFullPage />} errorElement={<ErrorComponent />}>
        <Route path="/select-organization" element={<SelectOrganization />} />
        <Route path="/create-organization" element={<CreateOrganization />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<Callback />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
    </>,
  ),
);

/* ---------------------- App ---------------------- */

function App() {
  const [theme, colorMode] = useMode();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    auth.api.get("/account/profile").then((response) => {
      if (response.data?.data || response.data) {
        console.log(response.data?.data || response.data);
        dispatch(setUser(response.data?.data || response.data));
      }
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    backendRequest({ endpoint: BACKEND_ENDPOINT.has_notifications }).then((res) => {
      if (res?.success) {
        dispatch(setNotificationCount(res.data.unread_count));
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
            <OrganizationProvider>
              <WorkspaceProvider>
                  <Suspense fallback={<PageFallback />}>
                    <RouterProvider router={router} />
                  </Suspense>
                <ConfirmDialog />
                <AlertDialog />
                <ToastContainer />
                <ActiveTimerWidget />
              </WorkspaceProvider>
            </OrganizationProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </QueryClientProvider>
  );
}

export default function AppWithAuth() {
  return (
    <AuthProvider
      onSessionExpired={(reason) => {
        window.location.href = "/login?expired=true&reason=" + encodeURIComponent(reason);
      }}
    >
      <App />
    </AuthProvider>
  );
}
