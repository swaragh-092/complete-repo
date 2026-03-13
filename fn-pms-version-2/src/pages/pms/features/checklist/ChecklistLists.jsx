import ActionColumn from "../../../../components/tools/ActionColumn";
import { showToast } from "../../../../util/feedback/ToastService";
import backendRequest from "../../../../util/request";
import BACKEND_ENDPOINT from "../../../../util/urls";
import { useState } from "react";
import CreateDialog from "../../../../components/pms/CreateDialog";
import EditDialog from "../../../../components/pms/EditDialog";
import { Box } from "@mui/material";
import Heading from "../../../../components/Heading";
import DoButton from "../../../../components/button/DoButton";
import DataTable from "../../../../components/tools/Datatable";

export default function ChecklistLists({ featureId }) {
  const [refresh, setRefresher] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingIds, setEditingIds] = useState([]);
  const [editDialog, setEditDialog] = useState({ open: false, checklist: {} });

  const handleDeleteChecklist = async (memberId) => {
    setEditingIds((prev) => [...prev, memberId]);
    const response = await deleteMemberRequest(memberId);
    if (response.success) setRefresher(true);
    setEditingIds((prev) => prev.filter((id) => id !== memberId)); // for remove after done
  };

  const handleEdit = (row) => {
    setEditDialog({ open: true, checklist: row });
  };
  const handleDelete = (row) => {
    handleDeleteChecklist(row.id);
  };
  const displayColumns = [
    { field: "title", headerName: "Title", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 100,
      flex: 0.2,
      sortable: false,
      renderCell: (params) => {
        const isEditing = editingIds.includes(params.row.id);
        return <ActionColumn params={params} isEditing={isEditing} editAction={handleEdit} deleteAction={handleDelete} />;
      },
    },
  ];

  const handleOnSuccess = () => {
    setOpen(false);
    setRefresher(true);
    setEditDialog({open:false, checklist:{}});
  };

  return (
    <>
      {featureId && (
        <Box m="20px">
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Heading title={"Check Lists"} level={2} />

            <DoButton onclick={() => setOpen(true)}>Add Checklist</DoButton>
          </Box>
          <DataTable columns={displayColumns} fetchEndpoint={BACKEND_ENDPOINT["checklist"](featureId)} refresh={refresh} setRefresh={setRefresher} defaultPageSize={5} />
        </Box>
      )}

      <CreateDialog isOpen={open} onClose={() => setOpen(false)} usefor={"Checklist"} backendEndpoint={BACKEND_ENDPOINT.checklist_create(featureId)} onSuccess={handleOnSuccess} formFields={formFields} />
      <EditDialog
        isOpen={editDialog.open}
        formFields={formFields}
        updateBackendEndpoint={BACKEND_ENDPOINT.checklist_update(editDialog.checklist?.id)} 
        onClose={() => {
          setEditDialog({ open: false, checklist: {} });
        }}
        onSuccess={handleOnSuccess}
        initialData={editDialog.checklist}
        useFor={"Checklist"}

      />
    </>
  );
}

const deleteMemberRequest = async (checklistId) => {
  const endpoint = BACKEND_ENDPOINT.checklist_delete(checklistId);
  const response = await backendRequest({ endpoint });

  showToast({ message: response.message ?? (response.success ? "Delected Successfully" : "Failed to delete"), type: response.success ? "success" : "error" });
  return response;
};

const formFields = [
  { type: "text", name: "title" },
  { type: "textarea", name: "description", label: "Description", require: false },
];
