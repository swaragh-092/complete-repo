// components/sessions/SessionDialogs.jsx
// Extracted from Sessions.jsx - Dialog components for session actions

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Button, Box
} from '@mui/material';
import { getDeviceType, getBrowserInfo } from './SessionRow';

/**
 * Logout all sessions confirmation dialog
 */
export function LogoutAllDialog({ 
  open, 
  onClose, 
  sessionCount, 
  onConfirm, 
  isLoading 
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Logout All Devices</DialogTitle>
      <DialogContent>
        <Typography paragraph>
          This will log you out of all devices and applications ({sessionCount} sessions).
          You'll need to sign in again on each device.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Logging out...' : 'Logout All'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/**
 * Terminate single session confirmation dialog
 */
export function TerminateSessionDialog({ 
  open, 
  session, 
  onClose, 
  onConfirm, 
  isLoading 
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Terminate Session</DialogTitle>
      <DialogContent>
        <Typography paragraph>
          Are you sure you want to terminate this session?
        </Typography>
        {session && (
          <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Session Details:
            </Typography>
            <Typography variant="body2">
              Device: {getDeviceType(session.userAgent)} • {getBrowserInfo(session.userAgent)}
            </Typography>
            <Typography variant="body2">
              IP: {session.ipAddress}
            </Typography>
            <Typography variant="body2">
              Application: {session.clientId || 'Unknown'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => onConfirm(session?.id)}
          color="error"
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Terminating...' : 'Terminate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
