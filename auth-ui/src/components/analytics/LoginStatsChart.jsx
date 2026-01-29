import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import analyticsService from '../../services/analyticsService';

function LoginStatsChart({ realmName }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['login-stats', realmName],
    queryFn: () => analyticsService.getLoginStats(realmName)
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
        <Typography color="error">Failed to load login stats</Typography>
      </Box>
    );
  }

  // Mock data transformation if API returns raw events
  // Assuming API returns array of { date: '2023-01-01', success: 10, failed: 2 }
  const chartData = data || [];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Login Activity (Last 7 Days)</Typography>
        <Box height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="success" stroke="#82ca9d" name="Success" />
              <Line type="monotone" dataKey="failed" stroke="#ff7300" name="Failed" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}

export default LoginStatsChart;
