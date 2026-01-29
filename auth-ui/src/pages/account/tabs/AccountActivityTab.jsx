import { Box, Paper, Typography, Divider } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

/**
 * AccountActivityTab - Displays user's recent security events
 */
export default function AccountActivityTab({ securityEvents }) {
  const eventsList = Array.isArray(securityEvents) ? securityEvents : [];

  return (
    <Paper 
      elevation={0}
      sx={{ 
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Recent Activity
        </Typography>
      </Box>
      <Divider />
      
      {eventsList.length > 0 ? (
        <Box>
          {eventsList.slice(0, 10).map((event, index) => (
            <Box 
              key={index}
              sx={{ 
                p: 2.5,
                borderBottom: index < Math.min(eventsList.length, 10) - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: event.type === 'LOGIN' ? 'success.50' : event.type === 'LOGOUT' ? 'warning.50' : 'info.50',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {event.type === 'LOGIN' ? (
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
                ) : event.type === 'LOGOUT' ? (
                  <WarningIcon sx={{ color: 'warning.main', fontSize: 18 }} />
                ) : (
                  <HistoryIcon sx={{ color: 'info.main', fontSize: 18 }} />
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {event.type || event.action || 'Unknown Event'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {event.ipAddress && `IP: ${event.ipAddress} • `}
                  {event.timestamp ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true }) : 'Unknown time'}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            No recent activity
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
