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
import { useOrganization } from "../../../context/OrganizationContext";

// import { useLoaderData } from "react-router-dom";
import { Typography, Stack, Chip, Box, LinearProgress, useTheme, CircularProgress } from "@mui/material";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import DoButton from "../../../components/button/DoButton";
import ProjectMembersList from "./members/ProjectMembersList";
import EditDialog from "../../../components/pms/EditDialog";
import ProjectFeatures from "./features/ProjectFeatures";
import ProjectPages from "./pages/ProjectPages";
import DeleteIcon from "@mui/icons-material/Delete";
import { colorCodes } from "../../../theme";
import { showToast } from "../../../util/feedback/ToastService";
import TaskList from "./task/TaskList";
import { showConfirmDialog } from "../../../util/feedback/ConfirmService";
import UserStoryCompletionWidget from "./userStories/UserStoryCompletionWidget";

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

export default function ProjectDetail() {
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();

  const [taskRefresh, setTaskRefresher] = useState(true);
  const response = useLoaderData();
  const [projectOverride, setProjectOverride] = useState(null);
  const project = projectOverride ?? response?.data;
  const setProject = setProjectOverride;

  const [isLoading, setLoading] = useState(false);
  const [projectProgress, setProjectProgress] = useState(null);

  const [editProjectDialog, setEditProjectDialog] = useState(false);
  const revalidator = useRevalidator();

  // Determine if the current user can approve tasks in this project
  const orgRole = currentOrganization?.role?.name?.toLowerCase();
  const isOrgApprover = ["owner", "admin"].includes(orgRole);
  const [isProjectLead, setIsProjectLead] = useState(false);
  const canApprove = isOrgApprover || isProjectLead;

  useEffect(() => {
    if (!project?.id || isOrgApprover) return;

    backendRequest({ endpoint: BACKEND_ENDPOINT.my_project_membership(project.id) }).then((res) => {
      if (res.success && res.data?.project_role === "lead") {
        setIsProjectLead(true);
      }
    });
  }, [project?.id, isOrgApprover]);

  useEffect(() => {
    if (!project?.id || project.type !== "site") return;
    backendRequest({ endpoint: BACKEND_ENDPOINT.project_progress(project.id) })
      .then((res) => { if (res?.success) setProjectProgress(res.data); });
  }, [project?.id, project?.type]);

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

  const handleDeleteProject = async () => {
    setLoading(true);
    const response = await deleteProjectBackend(project.id);

    if (response.success) navigate(paths.projects);
    showToast({ message: response.message || (response.success ? "Successfully Deleted" : "Failed to delete"), type: response.success ? "success" : "error" });
    setLoading(false);
  };

  return (
    <>
      <Box m="20px" marginBottom={"35px"}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading title={project.name} subtitle={project.description || "-"} giveMarginBottom={false} />
          <Box display={"flex"} alignItems={"center"} justifyContent={"center"}>
            {isLoading ? (
              <CircularProgress size={"15px"} />
            ) : (
              <DeleteIcon
                onClick={async () => {
                  showConfirmDialog({
                    title: "Delete Project",
                    message: "Are you sure of deleting project " + project.name,
                    onConfirm: handleDeleteProject,
                  });
                }}
                sx={{
                  cursor: "pointer",
                  color: colors.error.light,
                  "&:hover": { color: colors.error.modrate },
                }}
              />
            )}

            <DoButton onclick={() => setEditProjectDialog(true)}>Edit Project</DoButton>
            <DoButton
              isDisable={project.is_completed}
              onclick={async () => {
                showConfirmDialog({
                  title: "Complete Project",
                  message: "Are you sure you want to complete this project? Please ensure all validations are met (no open issues, no pending user stories, at least 5 completed stories).",
                  onConfirm: async () => {
                    setLoading(true);
                    const response = await backendRequest({
                      endpoint: BACKEND_ENDPOINT.completeProject(project.id),
                      method: "POST",
                    });

                    if (response.success) {
                      showToast({ message: "Project completed successfully", type: "success" });
                      setProject((prev) => ({ ...prev, is_completed: true }));
                      revalidator.revalidate();
                    } else {
                      const errorMsg = response.validation_errors
                        ? Object.entries(response.validation_errors)
                            .map(([key, val]) => `${key}: ${val}`)
                            .join(", ")
                        : response.message;
                      showToast({ message: errorMsg || "Failed to complete project", type: "error" });
                    }
                    setLoading(false);
                  },
                });
              }}
              disabled={project.is_completed}
            >
              {project.is_completed ? "Project Completed" : "Complete Project"}
            </DoButton>
          </Box>
        </Box>
        <Stack spacing={3} mt={3}>
          {/* Site project progress bar */}
          {project.type === "site" && projectProgress && (
            <Box maxWidth={500}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Site Progress ({projectProgress.completedItems}/{projectProgress.totalItems} items across all pages &amp; global components)
                </Typography>
                <Typography variant="caption" fontWeight="bold">{projectProgress.progress}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={projectProgress.progress}
                color={projectProgress.progress === 100 ? "success" : "primary"}
                sx={{ borderRadius: 1, height: 8 }}
              />
            </Box>
          )}
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
        <ProjectMembersList projectId={project.id} setTaskRefresher={setTaskRefresher} />
        {project.type === "site" ? (
          <ProjectPages projectId={project.id} setTaskRefresher={setTaskRefresher} />
        ) : (
          <ProjectFeatures projectId={project.id} setTaskRefresher={setTaskRefresher} />
        )}
      </Box>

      {/* <TaskList project_id={project.id} canApprove={canApprove} refresh={taskRefresh} setRefresher={setTaskRefresher} /> */}
      {/* <UserStoryCompletionWidget projectId={project.id} /> */}
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
  { 
    type: "select", 
    name: "type", 
    label: "Type", 
    options: [
      { value: "site", label: "Site" },
      { value: "application", label: "Application" }
    ]
  },
  { type: "date", name: "estimatedStartDate", label: "Estimated Start Date", validationName: "futureDate", lookFor: "estimated_start_date" },
  { type: "date", name: "estimatedEndDate", label: "Estimated End Date", validationName: "futureDate", lookFor: "estimated_end_date" },
];

async function deleteProjectBackend(projectId) {
  const endpoint = BACKEND_ENDPOINT.delete_project(projectId);
  const response = await backendRequest({
    endpoint,
  });

  return response;
}
