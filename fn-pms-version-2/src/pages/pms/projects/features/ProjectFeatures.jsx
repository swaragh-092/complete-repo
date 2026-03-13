import { useState } from "react";
import DataTable from "../../../../components/tools/Datatable";
import BACKEND_ENDPOINT from "../../../../util/urls";
import { Box } from "@mui/material";
import Heading from "../../../../components/Heading";
import AddMembersDialog from "../members/AddMembersDialog";
import DoButton from "../../../../components/button/DoButton";
import AddFeatureDialog from "./AddFeatureDialog";


  const displayColumns = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "department_id", headerName: "Department Id", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    { field: "status", headerName: "status", flex: 1, renderCell: (params) => {return params.row.projects.status} },
    // {
    //   field: "actions",
    //   headerName: "Actions",
    //   minWidth: 100,
    //   flex: 0.2,
    //   sortable: false,
    //   renderCell: (params) => {
    //     const isEditing = editingIds.includes(params.row.id);

    //     return (
    //       <Box display="flex" gap="10px" alignItems="center">
    //         {isEditing ? (
    //           <CircularProgress size={20} />
    //         ) : (
    //           <>
    //             <Box title="Edit">
    //               <EditIcon
    //                 onClick={() => {
    //                   setEditDialog({ open: true, member: params.row });
    //                 }}
    //                 sx={{
    //                   cursor: "pointer",
    //                   color: colors.text.dark,
    //                   "&:hover": { color: colors.secondary.dark },
    //                 }}
    //               />
    //             </Box>

    //             <Box title="Delete">
    //               <DeleteIcon
    //                 onClick={() => {
    //                   showConfirmDialog({
    //                     message: "Sure of removing member?",
    //                     title: "Delete Project Member",
    //                     onConfirm: () => handleDeleteMember(params.row.id),
    //                   });
    //                 }}
    //                 sx={{
    //                   cursor: "pointer",
    //                   color: colors.error.light,
    //                   "&:hover": { color: colors.error.modrate },
    //                 }}
    //               />
    //             </Box>
    //           </>
    //         )}
    //       </Box>
    //     );
    //   },
    // },
  ];  
export default function ProjectFeatures({projectId, setTaskRefresher=() => {}}) {
    const [refresh, setRefresher] = useState(true);
    const [open, setOpen] = useState(false);
    return (
        <>
        <Box p="20px" maxWidth={"49%"} width={"100%"} >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Heading title={"Project Features"} level={2} />

              <DoButton onclick={() => setOpen(true) }>Add Feature</DoButton>
            </Box>
            <DataTable columns={displayColumns} fetchEndpoint={BACKEND_ENDPOINT.project_features(projectId)} refresh={refresh} setRefresh={setRefresher} defaultPageSize={5}  />
          </Box>

          <AddFeatureDialog
            open={open}
            onClose={(refresh) => {
              setOpen(false);
              if (refresh) {
                  setRefresher(true);
                  setTaskRefresher(true);
              }
            }}
            projectId={projectId}
        />
        </>

    );
}