/* eslint-disable react-refresh/only-export-components */

// Author: Gururaj
// Created: 16th June 2025
// Description: Organization page to view organization details and manage departments.
// Version: 1.0.0
// pages/pms/department/DepartmentManage.jsx
// Modified:

import { redirect, useLoaderData, useNavigate, useRevalidator } from "react-router-dom";
import BACKEND_ENDPOINT, { paths } from "../../../util/urls";
import Heading from "../../../components/Heading";
import backendRequest from "../../../util/request";

// import { useLoaderData } from "react-router-dom";
import { Typography, Stack, Chip, Box, useTheme, CircularProgress } from "@mui/material";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import DoButton from "../../../components/button/DoButton";
import ProjectMembersList from "./members/ProjectMembersList";
import EditDialog from "../../../components/pms/EditDialog";
import ProjectFeatures from "./features/ProjectFeatures";
import DeleteIcon from "@mui/icons-material/Delete";
import { colorCodes } from "../../../theme";
import { showToast } from "../../../util/feedback/ToastService";
import TaskList from "./task/TaskList";
import { showConfirmDialog } from "../../../util/feedback/ConfirmService";
import ListLogs from "./logs/ListLogs";

export default function ProjectDetail() {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);


  const navigate = useNavigate();


  const [taskRefresh, setTaskRefresher] = useState(true);
  const response = useLoaderData();
  const [project, setProject] = useState(response?.data);
  const [ memberIdCreateTask, setMemberIdCreateTask ] = useState(null);

  const [ isLoading, setLoading ] = useState(false);

  const [editProjectDialog, setEditProjectDialog] = useState(false);
  const revalidator = useRevalidator();

  useEffect(() => {
    if (response?.data) {
      setProject(response.data);
    }
  }, [response?.data]);

  const onEditSuccess = (updatedData) => {
    setEditProjectDialog(false);
    // temporary local update
    setProject((prev) => ({ ...prev, ...updatedData }));
    // optional re-fetch for fresh data
    revalidator.revalidate();
  };

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch {
      return date;
    }
  };
  const InfoBox = ({ label, value }) => (
    <Box
      sx={{
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        p: 2,
        minWidth: 200,
        flex: 1,
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      {typeof value === "string" || typeof value === "number" ? <Typography variant="body1">{value || "-"}</Typography> : value}
    </Box>
  );

  const handleDeleteProject = async () => {
    setLoading(true);
    const response = await deleteProjectBackend(project.id);
    
    if (response.success) navigate(paths.projects);
    showToast({message : response.message || (response.success ? "Successfully Deleted" : "Failed to delete"), type: response.success ? "success" : "error"});
    setLoading(false);
  }

  return (
    <>
      <Box m="20px" marginBottom={"35px"}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading title={project.name} subtitle={project.description || "-"} giveMarginBottom={false} />
          <Box display={"flex"} alignItems={"center"} justifyContent={"center"}>
            {isLoading ? <CircularProgress size={"15px"} /> : (

              <DeleteIcon
                onClick={ async () => {
                  showConfirmDialog({
                    title : "Delete Project",
                    message : "Are you sure of deleting project " + project.name,
                    onConfirm : handleDeleteProject
                  });
                }}
              sx={{
                cursor: "pointer",
                color: colors.error.light,
                "&:hover": { color: colors.error.modrate },
              }}
            />
            ) }
            

            <DoButton onclick={() => setEditProjectDialog(true)}>Edit Project</DoButton>
            
          </Box>
        </Box>
        <Stack spacing={3} mt={3}>
          {/* Project Info */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <InfoBox label="Project Name" value={project.name} />
            <InfoBox label="Project Code" value={project.code?.toUpperCase()} />
            <InfoBox label="Visibility" value={<Chip label={project.visibility || "-"} size="small" />} />
          </Stack>

          {/* Description */}
          <InfoBox label="Description" value={project.description} />

          {/* Timeline */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
            <InfoBox label="Estimated Start" value={formatDate(project.estimated_start_date)} />
            <InfoBox label="Estimated End" value={formatDate(project.estimated_end_date)} />
            <InfoBox label="Actual Start" value={formatDate(project.start_date)} />
            <InfoBox label="Actual End" value={formatDate(project.end_date)} />
          </Stack>
        </Stack>
        <EditDialog
          isOpen={editProjectDialog}
          formFields={projectFormFields}
          updateBackendEndpoint={BACKEND_ENDPOINT.update_project(project.id)}
          onClose={() => {
            setEditProjectDialog(false);
          }}
          initialData={project}
          onSuccess={onEditSuccess}
          usedFor={"Project"}
        />
      </Box>
      <Box
        display={"flex"}
        width={"100%"}
        justifyContent={"space-around"}
        sx={{
          flexDirection: {
            xs: "column", // mobile
            sm: "column", // tablets
            md: "row", // desktop and above
          },
        }}
      >
        <ProjectMembersList projectId={project.id} setMemberIdCreateTask={setMemberIdCreateTask} setTaskRefresher={setTaskRefresher}  />
        <ProjectFeatures projectId={project.id} setTaskRefresher={setTaskRefresher} />
      </Box>

      <TaskList project_id={project.id} memberIdCreateTask={memberIdCreateTask} setMemberIdCreateTask={setMemberIdCreateTask} refresh={taskRefresh} setRefresher={setTaskRefresher} /> 
      <ListLogs projectId={project.id} />
    </>
  );
}

export async function projectFetchLoader({ params }) {
  const { id } = params;

  const endpoint = BACKEND_ENDPOINT.project_detail(id);

  const response = await backendRequest({
    endpoint,
    navigate: redirect,
  });

  if (response.status === 404 || response.status === 422) {
    throw new Response("Project not found", {
      status: 404,
      statusText: "Project not found",
    });
  }

  if (!response.ok) {
    throw new Error(response.message || "Failed to load Project");
  }
  return response;
}

const projectFormFields = [
  { type: "text", name: "name", label: "Name" },
  { type: "textarea", name: "description", label: "Description" },
  { type: "text", name: "code", label: "Code", validationName: "lettersAndUnderscoreValidation" },
  { type: "date", name: "estimatedStartDate", label: "Estimated Start Date", validationName: "futureDate", lookFor: "estimated_start_date" },
  { type: "date", name: "estimatedEndDate", label: "Estimated End Date", validationName: "futureDate", lookFor: "estimated_end_date" },
];


async function deleteProjectBackend (projectId) {
 
  const endpoint = BACKEND_ENDPOINT.delete_project(projectId);
  const response = await backendRequest({
    endpoint,
  });

  return response;

}

