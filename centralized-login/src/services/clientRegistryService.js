// services/clientRegistryService.js
// Abstraction layer for client configurations
// Supports static config (current) and API-backed (future) data sources

// Static client registry (current implementation)
import { CLIENT_CONFIGS } from '../config/clientRegistry';

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

// Current data source configuration - Using API mode now
const CURRENT_SOURCE = DATA_SOURCE.API;

/**
 * Cache for API-fetched clients (when using API source)
 */
let clientCache = null;
let cacheExpiry = null;
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
            return CLIENT_CONFIGS;
    }
}

/**
 * Get a specific client configuration by ID
 * @param {string} clientId - Client identifier
 * @returns {Promise<ClientConfig | null>}
 */
export async function getClient(clientId) {
    const clients = await getAllClients();
    return clients[clientId] || null;
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
    const clients = await getAllClients();
    return clientId in clients;
}

/**
 * Get list of all registered client IDs
 * @returns {Promise<string[]>}
 */
export async function getClientIds() {
    const clients = await getAllClients();
    return Object.keys(clients);
}

// ============================================================
// API IMPLEMENTATION (for future use)
// ============================================================

/**
 * Fetch clients from backend API
 * @returns {Promise<Object<string, ClientConfig>>}
 */
async function fetchClientsFromAPI() {
    // Check cache first
    if (clientCache && cacheExpiry && Date.now() < cacheExpiry) {
        return clientCache;
    }

    try {
        const authBaseUrl = import.meta.env.VITE_AUTH_BASE_URL;
        const response = await fetch(`${authBaseUrl}/clients`);

        if (!response.ok) {
            throw new Error(`Failed to fetch clients: ${response.status}`);
        }

        const clients = await response.json();

        // Transform API response to expected format
        clientCache = {};
        for (const client of clients) {
            clientCache[client.client_key || client.clientId] = {
                name: client.name || client.client_key,
                description: client.description || 'Application',
                icon: client.icon || '🔗',
                primaryColor: client.primary_color || '#3B82F6',
                redirectUrl: client.redirect_url || client.callback_url,
            };
        }

        cacheExpiry = Date.now() + CACHE_TTL_MS;
        return clientCache;
    } catch (error) {
        console.error('[ClientRegistry] Failed to fetch from API:', error);
        // Fall back to static config on error
        return CLIENT_CONFIGS;
    }
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
    clientCache = null;
    cacheExpiry = null;
}

// ============================================================
// SYNCHRONOUS HELPERS (for components that can't await)
// Use these only when async is not possible
// ============================================================

/**
 * Synchronous client lookup (uses static config only)
 * @param {string} clientId - Client identifier
 * @returns {ClientConfig}
 */
export function getClientSync(clientId) {
    return CLIENT_CONFIGS[clientId] || CLIENT_CONFIGS['account-ui'] || {
        name: 'Unknown Application',
        description: 'Unknown client application',
        icon: '❓',
        primaryColor: '#6B7280',
        redirectUrl: '/',
    };
}

/**
 * Get all clients synchronously (static config only)
 * @returns {Object<string, ClientConfig>}
 */
export function getAllClientsSync() {
    return CLIENT_CONFIGS;
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
