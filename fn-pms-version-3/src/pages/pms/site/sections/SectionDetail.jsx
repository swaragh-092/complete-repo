// Author: Copilot
// Description: Section detail view showing components under this site-project section.
// Version: 2.0.0

/* eslint-disable react-refresh/only-export-components */
import { redirect, useLoaderData, useNavigate, useRevalidator } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Box, Button, Chip, Stack } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Link } from "react-router-dom";
import Heading from "../../../../components/Heading";
import DoButton from "../../../../components/button/DoButton";
import EditDialog from "../../../../components/pms/EditDialog";
import CreateDialog from "../../../../components/pms/CreateDialog";
import DataTable from "../../../../components/tools/Datatable";
import BACKEND_ENDPOINT, { paths } from "../../../../util/urls";
import backendRequest from "../../../../util/request";
import { useWorkspace } from "../../../../context/WorkspaceContext";

const priorityColors = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "success",
};

const statusColors = {
  defined: "default",
  in_progress: "primary",
  review: "warning",
  completed: "success",
  blocked: "error",
};

// Components use 'title'
const componentColumns = [
  { field: "title", headerName: "Title", flex: 1 },
  { field: "description", headerName: "Description", flex: 1 },
  {
    field: "status",
    headerName: "Status",
    flex: 0.4,
    renderCell: (params) => (
      <Chip label={params.value || "defined"} size="small" color={statusColors[params.value] || "default"} />
    ),
  },
  { field: "priority", headerName: "Priority", flex: 0.4 },
  { field: "story_points", headerName: "Points", flex: 0.3 },
  {
    field: "actions",
    headerName: "Actions",
    minWidth: 80,
    flex: 0.2,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Box display="flex" justifyContent="center" alignItems="center" width="100%" height="100%">
        <Button component={Link} to={paths.component_detail(params.row.id).actualPath} variant="text" size="small" startIcon={<VisibilityIcon />} sx={{ textTransform: "none" }} />
      </Box>
    ),
  },
];

// Components use 'title'
const componentFormFields = [
  { type: "text", name: "title", label: "Title" },
  { type: "textarea", name: "description", label: "Description", require: false },
  {
    type: "select",
    name: "priority",
    label: "Priority",
    options: [
      { value: "critical", label: "Critical" },
      { value: "high", label: "High" },
      { value: "medium", label: "Medium" },
      { value: "low", label: "Low" },
    ],
  },
  { type: "number", name: "story_points", label: "Story Points", require: false },
];

export default function SectionDetail() {
  const response = useLoaderData();
  const [sectionOverride, setSectionOverride] = useState(null);
  const section = sectionOverride ?? response?.data;

  const { currentWorkspace } = useWorkspace();
  const [editDialog, setEditDialog] = useState(false);
  const [createComponentDialog, setCreateComponentDialog] = useState(false);
  const [componentRefresh, setComponentRefresh] = useState(true);
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const prevWorkspaceId = useRef();

  useEffect(() => {
    const currentId = currentWorkspace?.id;
    if (prevWorkspaceId.current && currentId && prevWorkspaceId.current !== currentId) {
      navigate(paths.pages);
    }
    prevWorkspaceId.current = currentId;
  }, [currentWorkspace?.id, navigate]);

  const onEditSuccess = (updatedData) => {
    setEditDialog(false);
    setSectionOverride((prev) => ({ ...(prev ?? response?.data), ...updatedData }));
    revalidator.revalidate();
  };

  return (
    <>
      <Box m="20px" mb="35px">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          {/* Sections use 'name' */}
          <Heading title={section.name} subtitle={section.description || "-"} giveMarginBottom={false} />
          <Stack direction="row" spacing={1}>
            <DoButton onclick={() => setCreateComponentDialog(true)}>Add Component</DoButton>
            <DoButton onclick={() => setEditDialog(true)}>Edit Section</DoButton>
          </Stack>
        </Box>

        <Stack direction="row" spacing={2} mt={2} flexWrap="wrap">
          <Chip label={`Priority: ${section.priority || "medium"}`} size="small" color={priorityColors[section.priority] || "default"} variant="outlined" />
          {section.page && (
            <Button component={Link} to={paths.page_detail(section.page_id).actualPath} variant="text" size="small" sx={{ p: 0 }}>
              ← {section.page.name}
            </Button>
          )}
        </Stack>

        {/* Sections use 'name' */}
        <EditDialog
          isOpen={editDialog}
          formFields={editFormFields}
          updateBackendEndpoint={BACKEND_ENDPOINT.update_section(section.id)}
          onClose={() => setEditDialog(false)}
          initialData={section}
          onSuccess={onEditSuccess}
          useFor="section"
        />
      </Box>

      {/* Components list */}
      <Box m="20px">
        <Heading title="Components" level={2} />
        <DataTable
          columns={componentColumns}
          fetchEndpoint={BACKEND_ENDPOINT.components_by_section(section.id)}
          refresh={componentRefresh}
          setRefresh={setComponentRefresh}
          defaultPageSize={10}
        />
      </Box>

      <CreateDialog
        isOpen={createComponentDialog}
        formFields={componentFormFields}
        onClose={() => setCreateComponentDialog(false)}
        usefor="Component"
        backendEndpoint={BACKEND_ENDPOINT.create_component(section.id)}
        extraData={{ departmentId: section.department_id, projectId: section.project_id }}
        onSuccess={() => {
          setCreateComponentDialog(false);
          setComponentRefresh(true);
        }}
      />
    </>
  );
}

export async function sectionFetchLoader({ params }) {
  const { id } = params;
  const endpoint = BACKEND_ENDPOINT.section_detail(id);
  const response = await backendRequest({ endpoint, navigate: redirect });

  if (response.status === 404 || response.status === 422) {
    throw new Response("Section not found", { status: 404, statusText: "Section not found" });
  }
  if (!response.ok) {
    throw new Error(response.message || "Failed to load section");
  }
  return response;
}

// Sections use 'name' (not 'title')
const editFormFields = [
  { type: "text", name: "name", label: "Name" },
  { type: "textarea", name: "description", label: "Description" },
  {
    type: "select",
    name: "priority",
    label: "Priority",
    options: [
      { value: "critical", label: "Critical" },
      { value: "high", label: "High" },
      { value: "medium", label: "Medium" },
      { value: "low", label: "Low" },
    ],
  },
];

