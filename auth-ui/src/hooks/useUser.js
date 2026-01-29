import { useQuery } from '@tanstack/react-query';
import { auth } from '@spidy092/auth-client';
import { useNavigate } from 'react-router-dom';

/**
 * Hook to fetch the current authenticated user profile
 * @returns {Object} { user, isLoading, error }
 */
export function useUser(options = {}) {
    const navigate = useNavigate();

    const handleAuthError = () => {
        auth.clearToken();
        navigate('/login');
    };

    const query = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const response = await auth.api.get('/auth/me');
            return response.data;
        },
        onError: (err) => {
            if (err.response?.status === 401) {
                handleAuthError();
            }
            options.onError?.(err);
        },
        retry: (failureCount, error) => failureCount < 3 && error.response?.status !== 401,
        enabled: !!auth.getToken(),
        ...options
    });

    return query;
}
