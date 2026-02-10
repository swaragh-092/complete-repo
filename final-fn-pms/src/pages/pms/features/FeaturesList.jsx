import { Link } from "react-router-dom";
import BACKEND_ENDPOINT, { paths } from "../../../util/urls";
import { useEffect, useState } from "react";
import { Box, Button, MenuItem, Select } from "@mui/material";
import Heading from "../../../components/Heading";
import DoButton from "../../../components/button/DoButton";
import DataTable from "../../../components/tools/Datatable";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CreateDialog from "../../../components/pms/CreateDialog";
import { activeUser } from "../../../dymmyData";
import { useWorkspace } from "../../../context/WorkspaceContext";

const displayColumns = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "description", headerName: "Overview", flex: 1 },
  { field: "checklists_count", headerName: "No of checklists", flex: 0.5, filterable: false },
  {
    field: "actions",
    headerName: "Actions",
    minWidth: 100,
    flex: 0.2,
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Box display="flex" justifyContent="center" alignItems="center" width="100%" height="100%">
        <Button
          component={Link}
          to={paths.feature_detail(params.row.id).actualPath} // Navigate using project id
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

const formFields = [
  { type: "text", name: "name" },
  { type: "textarea", name: "description", label: "Description", require: false },
];

export default function FeaturesList() {
  const { workspaces, currentWorkspace, selectWorkspace, loading, isAdmin } = useWorkspace();

  useEffect(() => {
    setRefresher(true);
  }, [currentWorkspace?.id]);

  const [refresh, setRefresher] = useState(false);
  const [createFormDialog, setCreateFormDialog] = useState(false);

  return (
    <Box m="20px">
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Heading title="Features" level={2} />
        {currentWorkspace?.id && (
          <>
            <Box display="flex" alignItems="center" justifyContent="center" marginLeft={2}>
              <DoButton
                onclick={() => {
                  setCreateFormDialog(true);
                }}
                variant="text"
              >
                Create new
              </DoButton>
            </Box>
          </>
        )}
        {/* Department Selector */}
      </Box>
      {currentWorkspace?.id && (
        <>
          <DataTable columns={displayColumns} fetchEndpoint={BACKEND_ENDPOINT["department_features"](currentWorkspace?.id)} refresh={refresh} setRefresh={setRefresher} />

          <CreateDialog
            formFields={formFields}
            isOpen={createFormDialog}
            onClose={() => {
              setCreateFormDialog(false);
            }}
            usefor={`Feature for ${currentWorkspace?.name} department`}
            onSuccess={() => setRefresher(true)}
            backendEndpoint={BACKEND_ENDPOINT["create_department_features"](currentWorkspace?.id)}
          />
        </>
      )}
      {
        !currentWorkspace?.id && (
          <>
            <p>Select workspace</p>
          </>
        )
      }
    </Box>
  );
}
