// centalized-login/src/config/clientRegistry.js
// 
// This file no longer contains hardcoded client configs.
// Client configurations are fetched from the backend API.
// Only 'account-ui' is kept as a fallback for the account management app itself.

const FALLBACK_CLIENT = {
  name: 'Account Management',
  description: 'Manage your profile and settings',
  icon: '👤',
  primaryColor: '#3B82F6',
  redirectUrl: import.meta.env.VITE_REDIRECT_URI
};

// Cache for fetched client configs
const clientCache = new Map();

/**
 * Get client configuration
 * @param {string} clientKey - The client key to look up
 * @returns {Promise<object>} Client configuration
 */
export async function getClientConfig(clientKey) {
  // Return cached config if available
  if (clientCache.has(clientKey)) {
    return clientCache.get(clientKey);
  }

  // Account-UI is always available as fallback
  if (clientKey === 'account-ui') {
    return FALLBACK_CLIENT;
  }

  try {
    const authBaseUrl = import.meta.env.VITE_AUTH_BASE_URL;
    const response = await fetch(`${authBaseUrl}/clients/${clientKey}/config`);

    if (!response.ok) {
      console.warn(`Failed to fetch config for client: ${clientKey}`);
      return FALLBACK_CLIENT;
    }

    const clientConfig = await response.json();

    // Transform backend format to UI format
    const config = {
      name: clientConfig.name || clientKey,
      description: clientConfig.description || 'Application',
      icon: clientConfig.icon || '🔗',
      primaryColor: clientConfig.primary_color || '#3B82F6',
      redirectUrl: clientConfig.redirect_url || clientConfig.callback_url
    };

    // Cache the result
    clientCache.set(clientKey, config);
    return config;

  } catch (error) {
    console.error(`Error fetching client config for ${clientKey}:`, error);
    return FALLBACK_CLIENT;
  }
}

/**
 * Synchronous fallback - returns minimal config immediately
 * Use getClientConfig() for full async loading
 * @deprecated Use getClientConfig() instead
 */
export function getClientConfigSync(clientKey) {
  if (clientCache.has(clientKey)) {
    return clientCache.get(clientKey);
  }

  if (clientKey === 'account-ui') {
    return FALLBACK_CLIENT;
  }

  // Return generic config - actual config should be loaded async
  return {
    name: clientKey,
    description: 'Loading...',
    icon: '🔗',
    primaryColor: '#3B82F6',
    redirectUrl: null
  };
}

/**
 * Preload client config into cache
 * Call this early in app lifecycle for better UX
 */
export async function preloadClientConfig(clientKey) {
  if (!clientCache.has(clientKey)) {
    await getClientConfig(clientKey);
  }
}

/**
 * Clear the client config cache
 * Useful after client updates
 */
export function clearClientCache() {
  clientCache.clear();
}

// Legacy export for backward compatibility
// TODO: Remove once all usages are migrated to async API
export const CLIENT_CONFIGS = {
  'account-ui': FALLBACK_CLIENT
};
