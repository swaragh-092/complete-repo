import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import analyticsService from '../../services/analyticsService';

function SessionStatsChart({ realmName }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['session-stats', realmName],
    queryFn: () => analyticsService.getSessionStats(realmName)
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={300}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={300}>
        <Typography color="error">Failed to load session stats</Typography>
      </Box>
    );
  }

  // Transform data for chart if needed
  // Assuming API returns { active: 10, offline: 5 }
  const chartData = [
    { name: 'Active', count: data?.activeSessions || 0 },
    { name: 'Offline', count: data?.offlineSessions || 0 }
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Active Sessions</Typography>
        <Box height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}

export default SessionStatsChart;
