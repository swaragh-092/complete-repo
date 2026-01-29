import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { securityApi } from '../api/security.api';
import { useToast } from '../context/ToastContext';

export function useSecurity() {
  const qc = useQueryClient();
  const { show } = useToast();

  const status = useQuery({
    queryKey: ['security-status'],
    queryFn: securityApi.getStatus,
    refetchInterval: 10_000,
  });

  const startSetup = useMutation({
    mutationKey: ['2fa', 'setup-start'],
    mutationFn: securityApi.start2FASetup,
    onSuccess: (data) => {
      window.open(data.redirectUrl, '_blank');
      show('Redirected to 2FA setup in Keycloak', 'info');
    },
    onError: (e) => show(e.response?.data?.message || 'Failed to start 2FA setup', 'error'),
  });

  const checkConfigured = useMutation({
    mutationKey: ['2fa', 'check-config'],
    mutationFn: securityApi.check2FAConfigured,
    onSuccess: (data) => {
      if (data.configured) {
        qc.invalidateQueries({ queryKey: ['security-status'] });
        show('2FA is active', 'success');
      }
    },
  });

  const disable = useMutation({
    mutationKey: ['2fa', 'disable'],
    mutationFn: securityApi.disable2FA,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['security-status'] });
      show('2FA disabled', 'warning');
    },
    onError: (e) => show(e.response?.data?.message || 'Failed to disable 2FA', 'error'),
  });

  const changePassword = useMutation({
    mutationKey: ['security', 'change-password'],
    mutationFn: securityApi.changePassword,
    onSuccess: () => show('Password changed successfully', 'success'),
    onError: (e) => show(e.response?.data?.message || 'Password change failed', 'error'),
  });

  return { status, startSetup, checkConfigured, disable, changePassword };
}
