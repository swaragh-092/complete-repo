import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile.api';
import { mapUserProfile } from '../models/UserProfile';
import { useToast } from '../context/ToastContext';

const PROFILE_QUERY_KEY = ['profile', 'full'];

export function useProfile(options = {}) {
  const queryClient = useQueryClient();
  const { show } = useToast();

  const profileQuery = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const raw = await profileApi.get();
      return mapUserProfile(raw);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    ...options,
  });

  const updateMutation = useMutation({
    mutationKey: ['profile', 'update'],
    mutationFn: profileApi.update,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      show('Profile updated successfully', 'success');
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
      show(error.response?.data?.message || 'Failed to update profile', 'error');
    },
  });

  const profile = useMemo(() => profileQuery.data || null, [profileQuery.data]);

  return {
    data: profile,
    isPending: profileQuery.isPending,
    isError: profileQuery.isError,
    refetch: profileQuery.refetch,
    error: profileQuery.error,
    updateProfile: updateMutation.mutate,
    updateProfileAsync: updateMutation.mutateAsync,
    updating: updateMutation.isPending,
  };
}
