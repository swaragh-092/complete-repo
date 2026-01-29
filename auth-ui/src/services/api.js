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

// ✅ Use auth-client's built-in API instance
export default auth.api;
