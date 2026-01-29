/**
 * @fileoverview ConfirmDialog Component
 * @description Reusable confirmation dialog for destructive actions
 */

import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

/**
 * ConfirmDialog - A reusable confirmation dialog component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether dialog is open
 * @param {function} props.onClose - Handler for dialog close
 * @param {function} props.onConfirm - Handler for confirm action
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Confirmation message
 * @param {boolean} [props.danger=false] - Whether this is a dangerous action
 * @param {string} [props.confirmText='Confirm'] - Confirm button text
 * @param {string} [props.cancelText='Cancel'] - Cancel button text
 * @param {boolean} [props.loading=false] - Show loading state on confirm
 */
function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  danger = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false
}) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle 
        id="confirm-dialog-title"
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: danger ? 'error.main' : 'text.primary'
        }}
      >
        {danger && <WarningIcon color="error" />}
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          color="inherit"
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          color={danger ? 'error' : 'primary'}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  danger: PropTypes.bool,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  loading: PropTypes.bool
};

export default ConfirmDialog;
