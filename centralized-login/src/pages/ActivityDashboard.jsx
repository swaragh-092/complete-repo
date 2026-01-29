import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Stack,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  Devices as DevicesIcon,
  AccountCircle as AccountIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { useAudit } from '../hooks/useAudit';
import { useDevices } from '../hooks/useDevices';
import { ExportButton } from '../components/common/ExportButton';
import { AdvancedFilters } from '../components/common/AdvancedFilters';
import { useKeyboardShortcuts, SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import { useQueryClient } from '@tanstack/react-query';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonGrid } from '../components/common/SkeletonLoader';

const MotionCard = motion.create(Card);

export default function ActivityDashboard() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({});

  const { loginHistory, loginHistoryQuery } = useAudit({ loginLimit: 50 });
  useDevices(); // Track devices in background

  // Keyboard shortcuts
  useKeyboardShortcuts({
    [SHORTCUTS.REFRESH]: () => {
      queryClient.invalidateQueries();
    },
  }, true);

  // Filter data based on active filters
  const filteredHistory = useMemo(() => {
    let filtered = loginHistory || [];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.ipAddress?.toLowerCase().includes(searchLower) ||
        item.userAgent?.toLowerCase().includes(searchLower) ||
        item.action?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate);
      filtered = filtered.filter(item => new Date(item.timestamp) >= start);
    }

    return filtered;
  }, [loginHistory, filters]);

  const activityStats = useMemo(() => {
    const total = filteredHistory.length;
    const successful = filteredHistory.filter(h => h.status === 'SUCCESS').length;
    const failed = total - successful;
    const uniqueIPs = new Set(filteredHistory.map(h => h.ipAddress)).size;

    return { total, successful, failed, uniqueIPs };
  }, [filteredHistory]);

  const handleExport = (format) => {
    console.log(`Exporting as ${format}`, filteredHistory);
  };

  if (loginHistoryQuery.isPending) {
    return (
      <Box>
        <SkeletonGrid items={4} />
        <LoadingSpinner message="Loading activity data..." />
      </Box>
    );
  }

  return (
    <Box component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                Total Activities
              </Typography>
              <Typography variant="h4" fontWeight={700} mt={0.5}>
                {activityStats.total}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                Successful
              </Typography>
              <Typography variant="h4" fontWeight={700} color="success.main" mt={0.5}>
                {activityStats.successful}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                Failed
              </Typography>
              <Typography variant="h4" fontWeight={700} color="error.main" mt={0.5}>
                {activityStats.failed}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MotionCard initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" textTransform="uppercase">
                Unique IPs
              </Typography>
              <Typography variant="h4" fontWeight={700} mt={0.5}>
                {activityStats.uniqueIPs}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <AdvancedFilters
            filters={{
              search: true,
              status: {
                options: [
                  { value: 'success', label: 'Success' },
                  { value: 'failed', label: 'Failed' },
                ],
              },
              dateRange: true,
            }}
            onFilterChange={setFilters}
            onClear={() => setFilters({})}
          />
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh (Ctrl+R)">
            <IconButton onClick={() => queryClient.invalidateQueries()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <ExportButton data={filteredHistory} filename="activity-log" onExport={handleExport} />
        </Stack>
      </Box>

      {/* Main Content */}
      <MotionCard initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <CardHeader
          title="Activity Timeline"
          subheader="Complete history of your account activities"
        />
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No activity found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Tooltip title={format(new Date(item.timestamp), 'PPpp')}>
                          <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.action || 'Unknown'}
                          size="small"
                          color={item.action?.includes('LOGIN') ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status === 'SUCCESS' ? 'Success' : 'Failed'}
                          size="small"
                          color={item.status === 'SUCCESS' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {item.ipAddress || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.userAgent?.substring(0, 50) || 'Unknown'}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.location || 'Unknown'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </MotionCard>
    </Box>
  );
}

