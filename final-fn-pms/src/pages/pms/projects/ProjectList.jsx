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
  { field: "start_date", headerName: "Date Started", flex: 1 },
  { field: "end_date", headerName: "Date Ended", flex: 1 },
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
          to={paths.projectDetail(params.row.id).actualPath} // Navigate using project id
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

export default function ProjectList() {
  const [refresh, setRefresher] = useState(true);
  const [createProjectDialog, setCreateProjectDialog] = useState(false);
  
  const [searchParams, setSearchParams] = useSearchParams();

  const urlHealth = searchParams.get(filterName);

  const handleRemoveFilter = () => {
    setSearchParams((prev) => {
      prev.set(filterName, "");
      return prev;
    });
    setRefresher(true);
  }

  return (
    <>
      <Box >
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
        isOpen={createProjectDialog || searchParams.get('action') === 'create'}
        onClose={() => {
          setCreateProjectDialog(false);
          setSearchParams((prev) => {
            prev.set("action", "");
            return prev;
          });
        }}
        onSuccess={() => setRefresher(true)}
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
