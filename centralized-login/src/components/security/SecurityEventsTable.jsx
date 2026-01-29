// components/security/SecurityEventsTable.jsx
// Extracted from SecuritySettings.jsx - Recent security events table

import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Tooltip, LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Key as KeyIcon,
  Warning as WarningIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';

/**
 * Get icon for event type
 */
function getEventIcon(type) {
  switch (type) {
    case 'LOGIN':
      return <CheckCircleIcon color="primary" sx={{ mr: 1 }} />;
    case 'PASSWORD_CHANGE':
      return <KeyIcon color="success" sx={{ mr: 1 }} />;
    case 'SUSPICIOUS':
      return <WarningIcon color="error" sx={{ mr: 1 }} />;
    default:
      return <HistoryIcon sx={{ mr: 1 }} />;
  }
}

/**
 * Security events table component
 */
export function SecurityEventsTable({ events, isLoading }) {
  if (isLoading) {
    return <LinearProgress />;
  }

  if (!events || events.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        No recent security events found
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Event</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>IP Address</TableCell>
            <TableCell>Device</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events.slice(0, 10).map((event, index) => (
            <TableRow key={index}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getEventIcon(event.type)}
                  {event.type.replace('_', ' ')}
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={event.success ? 'Success' : 'Failed'}
                  color={event.success ? 'success' : 'error'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Tooltip title={format(new Date(event.timestamp), 'PPpp')}>
                  <span>{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}</span>
                </Tooltip>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {event.ipAddress}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {event.userAgent?.substring(0, 50)}...
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default SecurityEventsTable;
