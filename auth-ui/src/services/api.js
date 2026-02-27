// admin-ui/src/services/api.js
import { auth } from '@spidy092/auth-client';

/**
 * Extract data from standardized API response
 * Response format: { success, statusCode, message, data, meta }
 * @param {Object} res - Axios response object
 * @returns {*} The extracted data payload
 */
export const extractData = (res) => res.data?.data ?? res.data;

/**
 * Extract array data, ensuring always returns array
 * @param {Object} res - Axios response object
 * @param {string} [key] - Optional key to extract array from
 * @returns {Array} The extracted array or empty array
 */
export const extractArray = (res, key) => {
    const data = extractData(res);
    if (Array.isArray(data)) return data;
    if (key && Array.isArray(data?.[key])) return data[key];
    return [];
};

/**
 * Extract paginated data from standardized API response
 * @param {Object} res - Axios response object
 * @returns {Object} Object containing rows and count
 */
export const extractPaginatedData = (res) => ({
    rows: res.data?.data ?? [],
    count: res.data?.meta?.total ?? res.data?.count ?? 0
});

// ✅ Add an interceptor to correctly route API calls
// The auth-client defaults config.baseURL to authBaseUrl (which includes /auth)
// However, many of admin-ui's APIs (/api/admin, /organizations) are hosted at the root of auth-service
auth.api.interceptors.request.use((config) => {
    // API endpoints that exist at the root URL (not under /auth)
    const rootApiPrefixes = [
        '/api/', '/organizations', '/permissions',
        '/db-roles', '/org-onboarding', '/workspaces',
        '/realms', '/users', '/clients', '/roles', '/organization-memberships'
    ];

    // Check if the request URL starts with any of the root API prefixes
    if (config.url && rootApiPrefixes.some(prefix => config.url.startsWith(prefix))) {
        // Adjust the base URL to drop the '/auth' segment for these specific calls
        if (config.baseURL && config.baseURL.endsWith('/auth')) {
            config.baseURL = config.baseURL.replace(/\/auth$/, '');
        }
    }

    return config;
});

export default auth.api;
