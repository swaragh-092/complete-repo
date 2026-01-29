import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../api/audit.api';

export function useAudit({ loginLimit = 30, filters = {} } = {}) {
  // Get comprehensive audit logs with filters
  const auditLogsQuery = useQuery({
    queryKey: ['audit', 'logs', filters],
    queryFn: () => auditApi.getAuditLogs({
      page: filters.page || 1,
      limit: filters.limit || 50,
      action: filters.action,
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.status,
      search: filters.search,
    }),
    staleTime: 2 * 60_000,
    enabled: filters.enabled !== false,
  });

  // Get login history
  const loginHistoryQuery = useQuery({
    queryKey: ['audit', 'login-history', loginLimit],
    queryFn: () => auditApi.getLoginHistory(loginLimit),
    staleTime: 5 * 60_000,
  });

  // Get security events
  const securityEventsQuery = useQuery({
    queryKey: ['audit', 'security-events', loginLimit],
    queryFn: () => auditApi.getSecurityEvents(loginLimit),
    staleTime: 2 * 60_000,
  });

  // Get session statistics
  const sessionStatsQuery = useQuery({
    queryKey: ['sessions', 'stats'],
    queryFn: auditApi.getSessionStats,
    staleTime: 5 * 60_000,
  });

  // Data is now extracted directly from API layer
  const auditLogs = useMemo(() => {
    const data = auditLogsQuery.data;
    return Array.isArray(data) ? data : (data?.logs || data?.data || []);
  }, [auditLogsQuery.data]);

  const auditLogsMeta = useMemo(() => ({
    total: auditLogsQuery.data?.total || auditLogsQuery.data?.pagination?.total || 0,
    page: auditLogsQuery.data?.page || auditLogsQuery.data?.pagination?.page || 1,
    limit: auditLogsQuery.data?.limit || auditLogsQuery.data?.pagination?.limit || 50,
    totalPages: auditLogsQuery.data?.totalPages || auditLogsQuery.data?.pagination?.totalPages || 0,
  }), [auditLogsQuery.data]);

  const loginHistory = useMemo(() => {
    const data = loginHistoryQuery.data;
    return Array.isArray(data) ? data : (data?.history || data?.logs || []);
  }, [loginHistoryQuery.data]);

  const securityEvents = useMemo(() => {
    const data = securityEventsQuery.data;
    return Array.isArray(data) ? data : (data?.events || []);
  }, [securityEventsQuery.data]);

  const sessionStats = useMemo(() => {
    const data = sessionStatsQuery.data;
    return data?.stats || data || null;
  }, [sessionStatsQuery.data]);

  return {
    // Comprehensive audit logs
    auditLogs,
    auditLogsMeta,
    auditLogsQuery,

    // Specific queries
    loginHistory,
    securityEvents,
    sessionStats,
    loginHistoryQuery,
    securityEventsQuery,
    sessionStatsQuery,
  };
}
