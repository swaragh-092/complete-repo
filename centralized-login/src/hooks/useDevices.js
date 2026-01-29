import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devicesApi } from '../api/devices.api';
import { useToast } from '../context/ToastContext';
import { auth } from '@spidy092/auth-client';

const DEVICES_KEY = ['devices', 'trusted'];

export function useDevices() {
  const queryClient = useQueryClient();
  const { show } = useToast();

  const devicesQuery = useQuery({
    queryKey: DEVICES_KEY,
    queryFn: devicesApi.getAll,
    staleTime: 120_000,
  });

  const trustMutation = useMutation({
    mutationKey: ['devices', 'trust'],
    mutationFn: (id) => devicesApi.trust(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
      show('Device trusted', 'success');
    },
    onError: (error) => {
      show(error.response?.data?.message || 'Failed to trust device', 'error');
    },
  });

  const revokeMutation = useMutation({
    mutationKey: ['devices', 'revoke'],
    mutationFn: (id) => devicesApi.revoke(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
      show('Device revoked', 'success');
    },
    onError: (error) => {
      show(error.response?.data?.message || 'Failed to revoke device', 'error');
    },
  });

  const revokeAllMutation = useMutation({
    mutationKey: ['devices', 'revoke-all'],
    mutationFn: devicesApi.revokeAll,
    onSuccess: () => {
      queryClient.clear();
      show('All devices revoked', 'success');
      setTimeout(() => auth.logout(), 1000);
    },
    onError: (error) => {
      show(error.response?.data?.message || 'Failed to revoke all devices', 'error');
    },
  });

  const registerMutation = useMutation({
    mutationKey: ['devices', 'register'],
    mutationFn: devicesApi.register,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
      show('Device registered', 'success');
    },
    onError: (error) => {
      show(error.response?.data?.message || 'Failed to register device', 'error');
    },
  });

  // devicesApi.getAll() now returns an array directly
  const devices = devicesQuery.data ?? [];

  return {
    data: devices,
    meta: { count: devices.length, success: true },
    isPending: devicesQuery.isPending,
    isError: devicesQuery.isError,
    error: devicesQuery.error,
    refetch: devicesQuery.refetch,
    trustDevice: trustMutation.mutate,
    trustDeviceAsync: trustMutation.mutateAsync,
    revokeDevice: revokeMutation.mutate,
    revokeDeviceAsync: revokeMutation.mutateAsync,
    revokeAll: revokeAllMutation.mutate,
    revokeAllAsync: revokeAllMutation.mutateAsync,
    registerDevice: registerMutation.mutate,
    registerDeviceAsync: registerMutation.mutateAsync,
    trusting: trustMutation.isPending,
    revoking: revokeMutation.isPending,
    revokingAll: revokeAllMutation.isPending,
    registering: registerMutation.isPending,
  };
}
