import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import userService from '../../services/userService';

function UserEventsTable({ realmName, userId }) {
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['user-events', realmName, userId],
    queryFn: () => userService.getUserEvents(userId, realmName)
  });

  if (isLoading) return <CircularProgress />;

  if (error) {
    return (
      <Alert severity="error">
        Failed to load events: {error.message}
      </Alert>
    );
  }

  const getEventColor = (type) => {
    if (type?.includes('ERROR')) return 'error';
    if (type?.includes('LOGIN')) return 'success';
    if (type?.includes('LOGOUT')) return 'warning';
    return 'default';
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>User Events</Typography>

      {events.length === 0 ? (
        <Alert severity="info">No events found for this user.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event, idx) => (
                <TableRow key={event.id || idx}>
                  <TableCell>
                    {event.time ? new Date(event.time).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={event.type} 
                      size="small" 
                      color={getEventColor(event.type)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{event.ipAddress || '-'}</TableCell>
                  <TableCell>{event.clientId || '-'}</TableCell>
                  <TableCell>
                    {event.details ? (
                      <Typography variant="caption" component="pre" sx={{ m: 0, fontSize: '0.7rem' }}>
                        {JSON.stringify(event.details, null, 2)}
                      </Typography>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default UserEventsTable;
