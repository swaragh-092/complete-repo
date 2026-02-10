import { Link } from "react-router-dom";
import BACKEND_ENDPOINT, { paths } from "../../../util/urls";
import { useState } from "react";
import { Box, Button, MenuItem, Select } from "@mui/material";
import Heading from "../../../components/Heading";
import DoButton from "../../../components/button/DoButton";
import DataTable from "../../../components/tools/Datatable";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CreateDialog from "../../../components/pms/CreateDialog";
import { activeUser } from "../../../dymmyData";

const displayColumns = [
  { field: "name", headerName: "Name", flex: 1 },
  { field: "description", headerName: "Overview", flex: 1 },
  { field: "checklists_count", headerName: "No of checklists", flex: 0.5, filterable: false,  },
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

// later we can add the user department id here from actual data
const user = activeUser;

export default function FeaturesList() {
  const [refresh, setRefresher] = useState(true);
  const [createFormDialog, setCreateFormDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(user.departments[0]);

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    const deptObj = user.departments.find((d) => d.id === deptId);
    setSelectedDepartment(deptObj);
    setRefresher(true); // trigger refresh when department changes
  };

  return (
    <Box m="20px">
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Heading title="Features" level={2} />

        {/* Department Selector */}
        <Box display="flex" alignItems="center" justifyContent="center" marginLeft={2}>
          <DoButton onclick={() => {setCreateFormDialog(true);}} variant="text">
            Create new
          </DoButton>
          <Select size="small" value={selectedDepartment.id} onChange={handleDepartmentChange} sx={{ minWidth: 250, ml: 2 }}>
            {user.departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      <DataTable columns={displayColumns} fetchEndpoint={BACKEND_ENDPOINT["department_features"](selectedDepartment.id)} refresh={refresh} setRefresh={setRefresher} />

      <CreateDialog
        formFields={formFields}
        isOpen={createFormDialog}
        onClose={() => {
          setCreateFormDialog(false);
        }}
        usefor={`Feature for ${selectedDepartment.name} department`}
        onSuccess={() => setRefresher(true)}
        backendEndpoint={BACKEND_ENDPOINT["create_department_features"](selectedDepartment.id)}
      />
    </Box>
  );
}
