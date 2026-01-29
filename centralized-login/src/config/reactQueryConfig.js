import { QueryClient}  from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 30 * 60 * 1000, // 30 minutes
            refetchOnWindowFocus: false,
        },

        mutations: {
            retry: 0,
            onError: (error) => {
                console.error('Mutation error:', error);
            },
        }
    }
})