import { useEffect, useState } from "react";
import { showToast } from "../util/feedback/ToastService";
import backendRequest from "../util/request";
import BACKEND_ENDPOINT from "../util/urls";
import AdminDashboard from "./pms/dashboard/AdminDashboard";
import WorkerDash from "./pms/dashboard/WorkerDashboard";

export default function Dash () {
  const [overviewData, setOverviewData] = useState({workerData: {}, adminData: {},});
  useEffect(() => {
    const fetchOverviewData = async () => {
      setOverviewData(prev => {return {workerData: prev.workerData, adminData: {}, loading : true}});
      const response = await getOverviewData(); 
      setOverviewData(prev => {return {workerData: prev.workerData, adminData: response?.data, loading : false}});
    };

    fetchOverviewData();
  }, []);
  return (
    <>
      {/* <WorkerDash/> */}
      <AdminDashboard data={overviewData.adminData} loading={overviewData.loading} />
    </>
  );
}



const getOverviewData = async () => {
  const response = await backendRequest({endpoint: BACKEND_ENDPOINT.overview});
  if (!response.success) {
    showToast({type: "error", message: response.message || "Failed to fetch overview data."});
  }
  return response;
};