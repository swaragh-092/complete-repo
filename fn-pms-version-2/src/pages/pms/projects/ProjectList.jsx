// Author: Gururaj
// Created: 21st October 2025
// Description: Listing all the Projects of organization.
// Version: 1.0.0
// Modified:

import { Box, Button } from "@mui/material";
import BACKEND_ENDPOINT, { paths } from "../../../util/urls";
import Heading from "../../../components/Heading";
import DataTable from "../../../components/tools/Datatable";
import { useState } from "react";
import DoButton from "../../../components/button/DoButton";
import { Link, useSearchParams } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CreateDialog from "../../../components/pms/CreateDialog";

const displayColumns = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "description", headerName: "Overview", flex: 1 },
  { field: "code", headerName: "Project Code", flex: 1 },
  {
    field: "start_date",
    headerName: "Date Started",
    flex: 1,
    renderCell: (params) => {
      const startDate = params.row.start_date;
      const estimatedStartDate = params.row.estimated_start_date;

      if (startDate) {
        return new Date(startDate).toLocaleDateString();
      }
      return `${new Date(estimatedStartDate).toLocaleDateString()} (estimated)`;
    },
  },
  {
    field: "end_date",
    headerName: "Date Ended",
    flex: 1,
    renderCell: (params) => {
      const endDate = params.row.end_date;
      const completedAt = params.row.completed_at;
      const estimatedEndDate = params.row.estimated_end_date;

      if (endDate) {
        return new Date(endDate).toLocaleDateString();
      }
      if (completedAt) {
        return new Date(completedAt).toLocaleDateString();
      }
      return `${new Date(estimatedEndDate).toLocaleDateString()} (estimated)`;
    },
  },
  {
    field: "is_completed",
    headerName: "Status",
    flex: 0.8,
    renderCell: (params) => {
      return params.row.is_completed ? "Completed" : "Ongoing";
    },
  },
  {
    field: "critical_high_issues_count",
    headerName: "Critical/High Issues",
    flex: 0.8,
    renderCell: (params) => {
      return params.row.critical_high_issues_count || "0";
    },
  },
  {
    field: "overdue_tasks_count",
    headerName: "Overdue Tasks",
    flex: 0.8,
    renderCell: (params) => {
      return params.row.overdue_tasks_count || "0";
    },
  },
  {
    field: "actions",
    headerName: "Actions",
    minWidth: 100,
    flex: 0.2,
    sortable: false,
    renderCell: (params) => (
      <Box display="flex" justifyContent="center" alignItems="center" width="100%" height="100%">
        <Button
          component={Link}
          to={paths.projectDetail(params.row.id).actualPath}
          variant="text"
          size="small"
          startIcon={<VisibilityIcon />}
          sx={{
            textTransform: "none",
            borderRadius: 2,
          }}
        ></Button>
      </Box>
    ),
  },
];

const filterName = "health";

export default function ProjectList({ onProjectCreated = () => {} }) {
  const [refresh, setRefresher] = useState(true);
  const [createProjectDialog, setCreateProjectDialog] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [urlHealth, setUrlHeath] = useState(searchParams.get(filterName));

  const handleRemoveFilter = () => {
    setSearchParams((prev) => {
      prev.set(filterName, "");
      return prev;
    });
    setUrlHeath("");
    setRefresher(true);
  };

  return (
    <>
      <Box>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Heading title={"Projects"} level={2} />
          <Box display="flex" gap={1}>
            {urlHealth && <DoButton onclick={handleRemoveFilter}>Remove Filter</DoButton>}
            <DoButton onclick={() => setCreateProjectDialog(true)}>Create Project</DoButton>
          </Box>
        </Box>
        <DataTable columns={displayColumns} fetchEndpoint={BACKEND_ENDPOINT["projects"](urlHealth)} refresh={refresh} setRefresh={setRefresher} />
      </Box>

      <CreateDialog
        usefor="Project"
        backendEndpoint={BACKEND_ENDPOINT.createProject}
        formFields={projectFormFields}
        isOpen={createProjectDialog || searchParams.get("action") === "create"}
        onClose={() => {
          setCreateProjectDialog(false);
          setSearchParams((prev) => {
            prev.set("action", "");
            return prev;
          });
        }}
        onSuccess={() => {
          setRefresher(true);
          onProjectCreated();
        }}
      />
    </>
  );
}

const projectFormFields = [
  { type: "text", name: "name" },
  { type: "textarea", name: "description", label: "Description" },
  { type: "text", name: "code", label: "Code", validationName: "lettersAndUnderscoreValidation" },
  { type: "date", name: "estimatedStartDate", label: "Estimated Start Date", validationName: "futureDate" },
  { type: "date", name: "estimatedEndDate", label: "Estimated End Date", validationName: "futureDate" },
];
