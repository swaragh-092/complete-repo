// services/clientRegistryService.js
// Abstraction layer for client configurations
// Supports static config (current) and API-backed (future) data sources

// Static client registry (DEPRECATED - API is now default)
// Only used for fallback in STATIC mode - which is no longer the default
// import { CLIENT_CONFIGS } from '../config/clientRegistry';

/**
 * Client configuration type definition
 * @typedef {Object} ClientConfig
 * @property {string} name - Client display name
 * @property {string} description - Client description
 * @property {string} icon - Client icon (emoji or URL)
 * @property {string} primaryColor - Primary color hex
 * @property {string} redirectUrl - OAuth redirect URL
 */

/**
 * Data source types for client registry
 */
export const DATA_SOURCE = {
  STATIC: 'static',      // Current: from clientRegistry.js
  API: 'api',            // Future: from backend API
  HYBRID: 'hybrid',      // Cache locally, sync from API
};

// Current data source configuration
// Changed to API as default - client configurations now come from the backend
const CURRENT_SOURCE = DATA_SOURCE.API;

/**
 * Cache for API-fetched clients (when using API source)
 */
const clientCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get all client configurations
 * @returns {Promise<Object<string, ClientConfig>>}
 */
export async function getAllClients() {
  switch (CURRENT_SOURCE) {
    case DATA_SOURCE.API:
      return fetchClientsFromAPI();
    case DATA_SOURCE.HYBRID:
      return getHybridClients();
    case DATA_SOURCE.STATIC:
    default:
      // Fallback only - most clients will use API
      return import('../config/clientRegistry').then(m => m.CLIENT_CONFIGS || {});
  }
}

/**
 * Get a specific client configuration by ID
 * @param {string} clientId - Client identifier
 * @returns {Promise<ClientConfig | null>}
 */
export async function getClient(clientId) {
  // Check cache first
  if (clientCache.has(clientId)) {
    const cached = clientCache.get(clientId);
    if (Date.now() < cached.expiry) {
      return cached.data;
    }
    clientCache.delete(clientId);
  }

  try {
    const authBaseUrl = import.meta.env.VITE_AUTH_BASE_URL;
    const response = await fetch(`${authBaseUrl}/clients/${clientId}/config`);

    if (!response.ok) {
      console.warn(`[ClientRegistry] Failed to fetch config for client: ${clientId}`);
      return null;
    }

    const apiConfig = await response.json();

    // Transform API format to UI format
    const clientConfig = {
      name: apiConfig.name || apiConfig.display_name || clientId,
      description: apiConfig.description || 'Application',
      icon: apiConfig.icon || '🔗',
      primaryColor: apiConfig.primary_color || '#3B82F6',
      redirectUrl: apiConfig.redirect_url || apiConfig.callback_url,
      // Include additional fields for organization-aware apps
      requiresOrganization: apiConfig.requires_organization || false,
      organizationModel: apiConfig.organization_model || null,
      onboardingFlow: apiConfig.onboarding_flow || null,
    };

    // Cache the result
    clientCache.set(clientId, {
      data: clientConfig,
      expiry: Date.now() + CACHE_TTL_MS,
    });

    return clientConfig;

  } catch (error) {
    console.error(`[ClientRegistry] Error fetching client config for ${clientId}:`, error);
    return null;
  }
}

/**
 * Get client or fall back to default
 * @param {string} clientId - Client identifier
 * @param {string} [fallbackId='account-ui'] - Fallback client ID
 * @returns {Promise<ClientConfig>}
 */
export async function getClientWithFallback(clientId, fallbackId = 'account-ui') {
  const client = await getClient(clientId);
  if (client) return client;
  
  const fallback = await getClient(fallbackId);
  return fallback || {
    name: 'Unknown Application',
    description: 'Unknown client application',
    icon: '❓',
    primaryColor: '#6B7280',
    redirectUrl: '/',
  };
}

/**
 * Check if a client ID exists in the registry
 * @param {string} clientId - Client identifier
 * @returns {Promise<boolean>}
 */
export async function clientExists(clientId) {
  const client = await getClient(clientId);
  return client !== null;
}

/**
 * Get list of all registered client IDs
 * NOTE: With API-based fetching, this currently returns an empty array.
 * Use the admin API to get a full list of clients.
 * @returns {Promise<string[]>}
 */
export async function getClientIds() {
  console.warn('[ClientRegistry] getClientIds is not fully supported in API mode');
  return [];
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

/**
 * Fetch all clients from backend API (for hybrid mode)
 * @returns {Promise<Object<string, ClientConfig>>}
 */
async function fetchClientsFromAPI() {
  // Currently not implemented - would need a /clients endpoint
  console.warn('[ClientRegistry] fetchClientsFromAPI not implemented');
  return {};
}

/**
 * Hybrid approach: use cache, sync from API in background
 * @returns {Promise<Object<string, ClientConfig>>}
 */
async function getHybridClients() {
  // Return cached/static immediately
  const current = clientCache || CLIENT_CONFIGS;
  
  // Sync in background if cache is stale
  if (!cacheExpiry || Date.now() > cacheExpiry) {
    fetchClientsFromAPI().catch(console.error);
  }
  
  return current;
}

/**
 * Clear the client cache (useful after admin updates)
 */
export function clearClientCache() {
  clientCache.clear();
}

// ============================================================
// SYNCHRONOUS HELPERS (DEPRECATED)
// These are kept for backward compatibility but should be avoided.
// Use async functions instead.
// ============================================================

/**
 * @deprecated Use getClient() instead - sync lookups no longer work with API mode
 * Returns a generic fallback config immediately
 * @param {string} clientId - Client identifier
 * @returns {ClientConfig}
 */
export function getClientSync(clientId) {
  // Check cache first
  if (clientCache.has(clientId)) {
    const cached = clientCache.get(clientId);
    if (Date.now() < cached.expiry) {
      return cached.data;
    }
  }
  // Return generic fallback - actual config must be loaded async
  console.warn(`[ClientRegistry] getClientSync: Sync lookup for ${clientId} - use async getClient instead`);
  return {
    name: clientId,
    description: 'Loading...',
    icon: '🔗',
    primaryColor: '#3B82F6',
    redirectUrl: null,
  };
}

/**
 * @deprecated Use getAllClients() instead
 * @returns {Object<string, ClientConfig>} Empty object - use async version
 */
export function getAllClientsSync() {
  console.warn('[ClientRegistry] getAllClientsSync is deprecated - use async getAllClients()');
  return {};
}

// Default export for convenience
export default {
  getAllClients,
  getClient,
  getClientWithFallback,
  clientExists,
  getClientIds,
  clearClientCache,
  // Sync variants
  getClientSync,
  getAllClientsSync,
  // Constants
  DATA_SOURCE,
};
