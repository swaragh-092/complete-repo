import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import realmService from '../services/realmService';
import { useSnackbar } from 'notistack';

/**
 * Hook to fetch realm details
 * @param {string} realmName 
 * @param {Object} options React Query options
 */
export function useRealm(realmName, options = {}) {
    return useQuery({
        queryKey: ['realm', realmName],
        queryFn: () => realmService.getRealmSettings(realmName),
        enabled: !!realmName,
        ...options
    });
}

/**
 * Hook to update realm details
 */
export function useUpdateRealm(options = {}) {
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();

    return useMutation({
        mutationFn: ({ realmName, data }) => realmService.updateRealm(realmName, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries(['realm', variables.realmName]);
            enqueueSnackbar('Realm settings updated successfully', { variant: 'success' });
            options.onSuccess?.(data, variables, context);
        },
        onError: (error, variables, context) => {
            enqueueSnackbar(`Failed to update realm: ${error.message}`, { variant: 'error' });
            options.onError?.(error, variables, context);
        },
        ...options
    });
}
