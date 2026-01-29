import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../api/sessions.api';
import { useToast } from '../context/ToastContext';
import { auth } from '@spidy092/auth-client';

const SESSIONS_KEY = ['sessions', 'list'];

export function useSessions() {
  const queryClient = useQueryClient();
  const { show } = useToast();

  const sessionsQuery = useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: sessionsApi.getAll,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });

  const terminateMutation = useMutation({
    mutationKey: ['sessions', 'terminate'],
    mutationFn: sessionsApi.terminate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
      show('Session terminated', 'success');
    },
    onError: (error) => {
      show(error.response?.data?.message || 'Failed to terminate session', 'error');
    },
  });

  const logoutAllMutation = useMutation({
    mutationKey: ['sessions', 'logout-all'],
    mutationFn: sessionsApi.logoutAll,
    onSuccess: () => {
      queryClient.clear();
      show('All sessions closed', 'success');
      auth.logout();
    },
    onError: (error) => {
      show(error.response?.data?.message || 'Failed to logout', 'error');
    },
  });

  return {
    data: sessionsQuery.data,
    isPending: sessionsQuery.isPending,
    isError: sessionsQuery.isError,
    error: sessionsQuery.error,
    refetch: sessionsQuery.refetch,
    terminateSession: terminateMutation.mutate,
    terminateSessionAsync: terminateMutation.mutateAsync,
    logoutAll: logoutAllMutation.mutate,
    logoutAllAsync: logoutAllMutation.mutateAsync,
    terminating: terminateMutation.isPending,
    loggingOutAll: logoutAllMutation.isPending,
  };
}
