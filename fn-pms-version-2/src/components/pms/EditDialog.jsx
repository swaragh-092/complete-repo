import { Dialog, DialogTitle, DialogContent, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import backedRequest from "../../util/request";
import DynamicForm from "../form/DynamicForm";

export default function EditDialog({ isOpen, formFields, updateBackendEndpoint, onClose, onSuccess = () => {}, initialData, useFor }) {
  // Update API call
  async function updateBackend(data) {
    const response = await backedRequest({
      endpoint: updateBackendEndpoint,
      bodyData: data,
    });

    if (response.success === true) {
      const updateData = Object.fromEntries(formFields.map((field) => [field.lookFor || field.name, data[field.name]]));
      onSuccess(updateData);
    }
    return response;
  }

  const formInitialData = formFields.reduce((acc, field) => {
    acc[field.name] = initialData[field.lookFor || field.name];
    return acc;
  }, {});
  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      {/* Header */}
      <DialogTitle sx={{ m: 0, p: 2, fontWeight: 600 }}>
        Edit {useFor}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <DynamicForm
            fields={formFields}
            initialData={formInitialData}
            onSubmit={updateBackend}
            onSuccess={() => {
              onClose();
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
