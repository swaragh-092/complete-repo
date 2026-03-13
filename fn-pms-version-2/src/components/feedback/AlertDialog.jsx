// Author: Gururaj
// Created: 21th May 2025
// Description: Alert message pop up component.
// Version: 1.0.0
// components/feedback/AlertDialog.jsx
// Modified:

import { useState, useEffect } from "react";

import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box, Typography, useTheme, Divider } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { colorCodes } from "../../theme";
import { setAlertHandler } from "../../util/feedback/AlertService";

const AlertDialog = () => {
  const [open, setOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState({
    title: "",
    message: "",
    onClose: () => {},
  });

  const theme = useTheme();
  const colors = colorCodes(theme.palette.mode);

  useEffect(() => {
    setAlertHandler(({ title, message, onClose }) => {
      setDialogProps({ title, message, onClose });
      setOpen(true);
    });
  }, []);
  // on close handler 
  const handleClose = () => {
    dialogProps.onClose?.();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: colors.background.default,
          borderLeft: `6px solid ${theme.palette.info.main}`,
          borderRadius: 12,
        },
      }}
    >
      <Box display="flex" alignItems="center" gap={2} px={3} pt={2}>
        <InfoOutlinedIcon fontSize="large" sx={{ color: theme.palette.info.main }} />
        <Typography variant="h6" fontWeight="bold">
          {dialogProps.title} 
        </Typography>
      </Box>

      <DialogContent>
        <DialogContentText sx={{ color: theme.palette.text.secondary }}>{dialogProps.message}</DialogContentText>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        <Button onClick={handleClose} variant="contained" color="primary">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertDialog;
