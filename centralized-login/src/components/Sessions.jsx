// account-ui/src/components/Sessions.jsx
// Refactored to use extracted presentational components and domain logic

import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Chip,
  Alert, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  ExitToApp as LogoutIcon,
  ExpandMore as ExpandMoreIcon,
  Apps as AppsIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '@spidy092/auth-client';

// Import extracted presentational components
import { 
  SessionStatsCards, 
  SessionRow, 
  LogoutAllDialog, 
  TerminateSessionDialog 
} from './sessions';

// Import domain logic (pure functions)
import {
  isCurrentSession,
  isSuspiciousSession,
  groupSessionsByClient,
  calculateSessionStats,
  getDeviceType,
} from '../domain';

function Sessions() {
  const queryClient = useQueryClient();
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [confirmTerminate, setConfirmTerminate] = useState(null);

  // Fetch ALL user sessions across different clients
  const { data: allSessions = [] } = useQuery({
    queryKey: ['all-user-sessions'],
    queryFn: async () => {
      const response = await auth.api.get('/account/sessions');
      const payload = response.data?.data ?? response.data;
      return Array.isArray(payload) ? payload : (payload?.sessions || []);
    },
    refetchInterval: 60 * 1000,
  });

  // Terminate session mutation
  const terminateSessionMutation = useMutation({
    mutationFn: (sessionId) => auth.api.delete(`/account/sessions/${sessionId}`),
    onSuccess: async (_data, sessionId) => {
      // Check if we deleted our OWN current session
      const deletedSession = allSessions.find(s => s.id === sessionId);
      if (deletedSession?.current) {
        // Deleted current session - logout immediately
        console.log('🔐 Current session deleted - logging out');
        auth.logout();
        return;
      }
      
      // Check if this was the last session - if so, also logout
      // (User deleted all their sessions)
      const remainingSessions = allSessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length === 0) {
        console.log('🔐 All sessions deleted - logging out');
        auth.logout();
        return;
      }
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['all-user-sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['session-validation'] })
      ]);
      setConfirmTerminate(null);
    }
  });

  // Logout all sessions mutation
  const logoutAllMutation = useMutation({
    mutationFn: () => auth.api.post('/account/logout-all'),
    onSuccess: async () => {
      queryClient.clear();
      setConfirmLogoutAll(false);
      auth.logout();
    }
  });

  // Use domain functions instead of inline implementations
  const sessionsByClient = groupSessionsByClient(allSessions);
  const stats = calculateSessionStats(allSessions);

  return (
    <Box>
      {/* Session Overview Cards - Extracted Component */}
      <SessionStatsCards stats={stats} />

      {/* Alert for suspicious sessions */}
      {stats.suspicious > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          <Typography variant="subtitle2" gutterBottom>
            Security Alert
          </Typography>
          We detected {stats.suspicious} session{stats.suspicious > 1 ? 's' : ''} with unusual activity.
          Please review and terminate any unrecognized sessions.
        </Alert>
      )}

      {/* Main Sessions Card */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                All Active Sessions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your sessions across all connected applications and devices
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={() => setConfirmLogoutAll(true)}
              disabled={allSessions.length === 0}
            >
              Logout All
            </Button>
          </Box>

          {/* Sessions grouped by client */}
          {Object.entries(sessionsByClient).map(([clientName, sessions]) => (
            <Accordion key={clientName} sx={{ mb: 2 }} defaultExpanded={sessions.some(isCurrentSession)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <AppsIcon />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="600">
                      {clientName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sessions.length} session{sessions.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  {sessions.some(isCurrentSession) && (
                    <Chip label="Current" color="primary" size="small" />
                  )}
                  {sessions.some(s => isSuspiciousSession(s)) && (
                    <Chip label="Alert" color="warning" size="small" />
                  )}
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Device & Browser</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Last Activity</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sessions.map((session) => (
                        <SessionRow
                          key={session.id}
                          session={session}
                          isCurrent={isCurrentSession(session)}
                          isSuspicious={isSuspiciousSession(session)}
                          onTerminate={setConfirmTerminate}
                          isTerminating={terminateSessionMutation.isPending}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}

          {allSessions.length === 0 && (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">
                No active sessions found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Extracted Dialog Components */}
      <LogoutAllDialog
        open={confirmLogoutAll}
        onClose={() => setConfirmLogoutAll(false)}
        sessionCount={stats.active}
        onConfirm={() => logoutAllMutation.mutate()}
        isLoading={logoutAllMutation.isPending}
      />

      <TerminateSessionDialog
        open={!!confirmTerminate}
        session={confirmTerminate}
        onClose={() => setConfirmTerminate(null)}
        onConfirm={(sessionId) => terminateSessionMutation.mutate(sessionId)}
        isLoading={terminateSessionMutation.isPending}
      />
    </Box>
  );
}

export default Sessions;