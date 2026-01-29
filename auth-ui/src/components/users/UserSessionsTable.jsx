import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
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
  Button,
  CircularProgress
} from '@mui/material';
import userService from '../../services/userService';

function UserSessionsTable({ realmName, userId }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  // Fetch sessions
  const { data: sessions = [], isLoading, error } = useQuery({
    queryKey: ['user-sessions', realmName, userId],
    queryFn: () => userService.getUserSessions(realmName, userId)
  });

  // Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: () => userService.logoutUser(realmName, userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-sessions', realmName, userId]);
      enqueueSnackbar('User logged out successfully', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to logout user', { variant: 'error' });
    }
  });

  if (isLoading) return <CircularProgress />;
  if (error) return <Typography color="error">Failed to load sessions</Typography>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Active Sessions</Typography>
        <Button 
          variant="outlined" 
          color="error"
          onClick={() => logoutMutation.mutate()}
          disabled={sessions.length === 0 || logoutMutation.isPending}
        >
          Logout All Sessions
        </Button>
      </Box>

      {sessions.length === 0 ? (
        <Typography color="text.secondary">No active sessions found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>IP Address</TableCell>
                <TableCell>Started</TableCell>
                <TableCell>Last Access</TableCell>
                <TableCell>Client</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.ipAddress}</TableCell>
                  <TableCell>{new Date(session.start).toLocaleString()}</TableCell>
                  <TableCell>{new Date(session.lastAccess).toLocaleString()}</TableCell>
                  <TableCell>{session.clients && Object.values(session.clients).join(', ')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default UserSessionsTable;
