import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Button, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import backedRequest from "../../util/request";
import DynamicForm from "../form/DynamicForm";



export default function CreateDialog({ isOpen, onClose, usefor, backendEndpoint, onSuccess= () => {}, formFields, useOnlyGivenName = false, extraData = {} }) {
    async function handleCreate(data) {
        const response = await backedRequest({endpoint: backendEndpoint, bodyData: {...data, ...extraData}, });
        return response;
    }
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: 3, p: 1 },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ m: 0, p: 2, fontWeight: 600 }}>
        {useOnlyGivenName ? "" : "Create "}{usefor}
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

      {/* Content (You’ll add inputs here later) */}
      <DialogContent dividers>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 1,
          }}
        >
          
          <DynamicForm fields={formFields} onSubmit={handleCreate} onSuccess={() => {onClose(); onSuccess()}} />
           
        </Box>
      </DialogContent>
    </Dialog>
  );
}



