import {
  Box,
  Paper,
  Typography,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import { Devices as DevicesIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

/**
 * AccountSessionsTab - Displays user's active sessions
 */
export default function AccountSessionsTab({ sessions }) {
  const sessionsList = Array.isArray(sessions) ? sessions : [];

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
      <Box sx={{ p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={600}>
          Active Sessions
        </Typography>
        <Chip 
          label={`${sessionsList.length} Active`}
          size="small"
          sx={{
            bgcolor: 'success.50',
            color: 'success.700',
            fontWeight: 600
          }}
        />
      </Box>
      <Divider />
      
      {sessionsList.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Device</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>IP Address</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Last Active</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessionsList.map((session, index) => (
              <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <DevicesIcon sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" fontWeight={500}>
                      {session.device || 'Unknown Device'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {session.ipAddress || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {session.lastAccess ? formatDistanceToNow(new Date(session.lastAccess), { addSuffix: true }) : 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label="Active"
                    size="small"
                    sx={{
                      bgcolor: 'success.50',
                      color: 'success.700',
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <DevicesIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            No active sessions
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
