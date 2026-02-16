// hooks/useClientRegistry.js
// React hook for consuming client registry service

import { useQuery } from '@tanstack/react-query';
import clientRegistry from '../services/clientRegistryService';

/**
 * Hook to get all clients from the registry
 * @param {Object} options - React Query options
 * @returns {Object} Query result with data as client configs
 */
export function useClients(options = {}) {
  return useQuery({
    queryKey: ['client-registry', 'all'],
    queryFn: () => clientRegistry.getAllClients(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    ...options,
  });
}

/**
 * Hook to get a specific client by ID
 * @param {string} clientId - Client identifier
 * @param {Object} options - React Query options
 * @returns {Object} Query result with data as client config
 */
export function useClient(clientId, options = {}) {
  return useQuery({
    queryKey: ['client-registry', clientId],
    queryFn: () => clientRegistry.getClientWithFallback(clientId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!clientId,
    ...options,
  });
}

/**
 * Hook to check if a client exists
 * @param {string} clientId - Client identifier
 * @returns {Object} Query result with data as boolean
 */
export function useClientExists(clientId) {
  return useQuery({
    queryKey: ['client-registry', 'exists', clientId],
    queryFn: () => clientRegistry.clientExists(clientId),
    staleTime: 5 * 60 * 1000,
    enabled: !!clientId,
  });
}

/**
 * Hook to get the current client from URL params
 * Automatically extracts client_key from URL query params
 * @returns {Object} { clientId, client, isLoading, error }
 */
export function useCurrentClient() {
  // Get client_key from URL
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get('client_key') || 'account-ui';

  const query = useClient(clientId);

  return {
    clientId,
    client: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}

// Default export
export default {
  useClients,
  useClient,
  useClientExists,
  useCurrentClient,
};
