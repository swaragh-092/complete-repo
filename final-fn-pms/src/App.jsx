import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
  Navigate,
} from "react-router-dom";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { SnackbarProvider } from "notistack";
import { useEffect } from "react";
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

import Dash from "./pages/Dash";
import ProjectDashboard from "./pages/pms/projects/ProjectDashboard";
import ProjectDetailView, { projectFetchLoader } from "./pages/pms/projects/ProjectDetail";
import FeaturesList from "./pages/pms/features/FeaturesList";
import FeatureDetail, { featureFetchLoader } from "./pages/pms/features/FeatureDetialView";
import TaskPage from "./pages/pms/projects/task/TaskPage";
import Issue from "./pages/pms/issue/IssueList";
import DailyLog from "./pages/pms/dailylogs/DailyLog";
import Notification from "./pages/pms/notification/Notification";

import Login from "./pages/Login";
import Callback from "./pages/Callback";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import InviteMembers from "./pages/InviteMembers";
import SelectOrganization from "./pages/SelectOrganization";
import CreateOrganization from "./pages/CreateOrganization";

import { OrganizationProvider } from "./context/OrganizationContext";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { setUser } from "./store/authSlice";

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
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!sessionValid) {
    return <Navigate to="/login?expired=true" replace />;
  }

  return <Layout />;
}


/* ---------------------- Router ---------------------- */

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<ProtectedLayout />} errorElement={<ErrorComponent />}>
        <Route index element={<Dash />} />

        <Route path={paths.projects()} element={<ProjectDashboard />} />
        <Route
          path={paths.projectDetail().path}
          element={<ProjectDetailView />}
          loader={projectFetchLoader}
        />

        <Route path={paths.issues} element={<Issue />} />
        <Route path={paths.daily_logs} element={<DailyLog />} />
        <Route path={paths.notifications} element={<Notification />} />
        <Route path={paths.tasks} element={<TaskPage />} />
        <Route path={paths.features} element={<FeaturesList />} />
        <Route
          path={paths.feature_detail().path}
          element={<FeatureDetail />}
          loader={featureFetchLoader}
        />

        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/invite-members" element={<InviteMembers />} />
        <Route path="/select-organization" element={<SelectOrganization />} />
        <Route path="/create-organization" element={<CreateOrganization />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<Callback />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
    </>
  )
);

/* ---------------------- App ---------------------- */

function App() {
  const [theme, colorMode] = useMode();
  const dispatch = useDispatch();

  useEffect(() => {
    auth.api.get('/account/profile').then((response) => {
      if (response.data?.data || response.data) {
        console.log(response.data?.data || response.data);
        dispatch(setUser(response.data?.data || response.data));
      }
    })
  }, []);
  

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
            <RouterProvider router={router} />
            <ConfirmDialog />
            <AlertDialog />
            <ToastContainer />
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
        window.location.href =
          "/login?expired=true&reason=" + encodeURIComponent(reason);
      }}
    >
      <OrganizationProvider>
        <WorkspaceProvider>
          <App />
        </WorkspaceProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}

