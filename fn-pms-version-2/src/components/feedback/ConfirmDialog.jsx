// Author: Gururaj
// Created: 23rd May 2025
// Description: confirm box component.
// Version: 1.0.0
// components/feedback/ConfirmDialog.jsx
// Modified: 

import { useState, useEffect } from "react";

import { Dialog,  DialogContent, DialogContentText, DialogActions, Button, Box, Typography, useTheme, Divider } from "@mui/material";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";

import { colorCodes } from "../../theme";
import { setConfirmHandler } from "../../util/feedback/ConfirmService";

const ConfirmDialog = () => {
  const [open, setOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  useEffect(() => {
    setConfirmHandler(({ title, message, onConfirm }) => {
      setDialogProps({ title, message, onConfirm });
      setOpen(true);
    });
  }, []);

  const handleClose = () => setOpen(false);

  const handleConfirm = () => {
    dialogProps.onConfirm?.();
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        style: {
          borderLeft: `6px solid ${colors.warning.modrate}`,
          borderRadius: 12,
          backgroundColor: colors.background.dark,
        },
      }}
    >
      <Box display="flex" alignItems="center" gap={2} px={3} pt={2}>
        <ReportProblemOutlinedIcon fontSize="large" sx={{ color: colors.warning.modrate }} />
        <Typography variant="h6" fontWeight="bold">
          {dialogProps.title}
        </Typography>
      </Box>

      <DialogContent>
        <DialogContentText sx={{ color: colors.text.light }}>{dialogProps.message}</DialogContentText>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="error">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
