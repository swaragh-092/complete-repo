import { useEffect, useState } from "react";
import { showToast } from "../util/feedback/ToastService";
import backendRequest from "../util/request";
import BACKEND_ENDPOINT from "../util/urls";
import AdminDashboard from "./pms/dashboard/AdminDashboard";
import WorkerDash from "./pms/dashboard/WorkerDashboard";
import { useWorkspace } from "../context/WorkspaceContext";

export default function Dash() {
  const { currentWorkspace } = useWorkspace();
  const role = currentWorkspace?.role;

  const [overviewData, setOverviewData] = useState({ adminData: {}, loading: false });

  useEffect(() => {
    if (role !== "admin") return; // only admin needs the overview endpoint
    const fetchOverviewData = async () => {
      setOverviewData({ adminData: {}, loading: true });
      const response = await getOverviewData();
      setOverviewData({ adminData: response?.data, loading: false });
    };
    fetchOverviewData();
  }, [role]);

  if (role === "admin") {
    return <AdminDashboard data={overviewData.adminData} loading={overviewData.loading} />;
  }

  // editor and viewer both get the member-focused dashboard
  return <WorkerDash />;
}

const getOverviewData = async () => {
  const response = await backendRequest({ endpoint: BACKEND_ENDPOINT.overview });
  if (!response.success) {
    showToast({ type: "error", message: response.message || "Failed to fetch overview data." });
  }
  return response;
};
