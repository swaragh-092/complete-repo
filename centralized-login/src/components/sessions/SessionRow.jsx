// components/sessions/SessionRow.jsx
// Extracted from Sessions.jsx - Presentational component for a single session row

import {
  Box, TableRow, TableCell, IconButton, Chip, Typography
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Computer as ComputerIcon,
  Phone as PhoneIcon,
  Tablet as TabletIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

/**
 * Get device icon based on user agent
 */
export function getDeviceIcon(userAgent) {
  if (!userAgent) return <ComputerIcon />;

  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return <PhoneIcon />;
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return <TabletIcon />;
  }
  return <ComputerIcon />;
}

/**
 * Get device type string from user agent
 */
export function getDeviceType(userAgent) {
  if (!userAgent) return 'Desktop';

  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'Mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'Tablet';
  }
  return 'Desktop';
}

/**
 * Get browser info from user agent
 */
export function getBrowserInfo(userAgent) {
  if (!userAgent) return 'Unknown Browser';

  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  return 'Unknown Browser';
}

/**
 * Single session row component
 * @param {Object} props
 * @param {Object} props.session - Session data object
 * @param {boolean} props.isCurrent - Whether this is the current session
 * @param {boolean} props.isSuspicious - Whether this session is flagged as suspicious
 * @param {Function} props.onTerminate - Callback when terminate is clicked
 * @param {boolean} props.isTerminating - Whether termination is in progress
 */
export function SessionRow({ 
  session, 
  isCurrent, 
  isSuspicious, 
  onTerminate, 
  isTerminating 
}) {
  return (
    <TableRow
      sx={isSuspicious ? { bgcolor: 'warning.light', opacity: 0.7 } : {}}
    >
      <TableCell>
        <Box display="flex" alignItems="center">
          {getDeviceIcon(session.userAgent)}
          <Box ml={2}>
            <Typography variant="body2">
              {getDeviceType(session.userAgent)} • {getBrowserInfo(session.userAgent)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {session.ipAddress}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      <TableCell>
        <Box display="flex" alignItems="center">
          <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
          <Typography variant="body2">
            {session.location || session.country || 'Unknown Location'}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Box display="flex" alignItems="center">
          <ScheduleIcon sx={{ mr: 1, fontSize: 16 }} />
          <Typography variant="body2">
            {session.lastAccess
              ? formatDistanceToNow(new Date(session.lastAccess), { addSuffix: true })
              : 'Unknown'}
          </Typography>
        </Box>
      </TableCell>

      <TableCell>
        <Box display="flex" gap={0.5}>
          {isCurrent ? (
            <Chip label="Current" color="primary" size="small" />
          ) : (
            <Chip label="Active" color="default" size="small" />
          )}
          {isSuspicious && (
            <Chip label="Alert" color="warning" size="small" />
          )}
        </Box>
      </TableCell>

      <TableCell>
        {!isCurrent && (
          <IconButton
            onClick={() => onTerminate(session)}
            size="small"
            color="error"
            disabled={isTerminating}
          >
            <DeleteIcon />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );
}

export default SessionRow;
