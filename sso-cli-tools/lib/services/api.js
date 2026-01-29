/**
 * @fileoverview API Service
 * @description Centralized API communication with error handling
 */

import axios from 'axios';
import https from 'https';
import { SSO_CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';

// HTTPS agent for self-signed certificates (mkcert)
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/**
 * Configured axios instance
 */
const api = axios.create({
    baseURL: SSO_CONFIG.authServiceUrl,
    timeout: SSO_CONFIG.apiTimeout,
    httpsAgent,
});

/**
 * Request Interceptor - No changes needed
 */

/**
 * Response Interceptor - Handle SSL Falback
 */
api.interceptors.response.use(null, async (error) => {
    const originalRequest = error.config;

    // Check for SSL Protocol Error (HTTPS client -> HTTP server)
    // EPROTO: Common Node.js SSL protocol error
    // ERR_SSL_WRONG_VERSION_NUMBER: OpenSSL specific error
    if (originalRequest && !originalRequest._retry &&
        (error.code === 'EPROTO' || error.code === 'ERR_SSL_WRONG_VERSION_NUMBER')) {

        originalRequest._retry = true;
        logger.warn('⚠️  SSL Negotiation Failed. Auth service seems to be running in HTTP mode.');
        logger.info('🔄 Switching protocol to HTTP and retrying...');

        // Construct HTTP URL
        const httpBaseUrl = SSO_CONFIG.authServiceUrl.replace('https://', 'http://');

        // Update default instance for future requests
        api.defaults.baseURL = httpBaseUrl;

        // Update current request
        originalRequest.baseURL = httpBaseUrl;

        // Remove HTTPS agent to allow standard HTTP connection
        delete originalRequest.httpsAgent;

        // Update protocol in URL if it was absolute
        if (originalRequest.url.startsWith('https://')) {
            originalRequest.url = originalRequest.url.replace('https://', 'http://');
        }

        try {
            return await api(originalRequest);
        } catch (retryError) {
            // If retry fails, throw the new error to be handled by handleApiError
            return Promise.reject(retryError);
        }
    }

    // Pass through other errors
    return Promise.reject(error);
});

/**
 * API error handler
 * @param {Error} error - Axios error
 * @throws {Error} Rethrows with better message
 */
function handleApiError(error) {
    if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const message = error.response.data?.message || error.response.statusText;

        if (status === 404) {
            throw new Error(`Not found: ${message}`);
        } else if (status === 401) {
            throw new Error(`Unauthorized: ${message}`);
        } else if (status === 400) {
            throw new Error(`Bad request: ${message}`);
        } else {
            throw new Error(`Server error (${status}): ${message}`);
        }
    } else if (error.code === 'ECONNREFUSED') {
        throw new Error(
            `Cannot connect to auth service at ${error.config?.baseURL || SSO_CONFIG.authServiceUrl}. ` +
            'Is the server running?'
        );
    } else {
        throw error;
    }
}

/**
 * Auth Service API
 */
export const authApi = {
    /**
     * Register a new client
     * @param {Object} clientData - Client registration data
     * @returns {Promise<Object>} Registration response
     */
    async registerClient(clientData) {
        try {
            const response = await api.post('/auth/client-requests', clientData);
            return response.data;
        } catch (error) {
            handleApiError(error);
        }
    },

    /**
     * Get client request status
     * @param {string} clientKey - Client key
     * @returns {Promise<Object>} Status response
     */
    async getClientStatus(clientKey) {
        try {
            const response = await api.get(`/auth/client-requests/${clientKey}/status`);
            // ResponseHandler wraps data: { success, data: { request }, ... }
            return response.data.data || response.data;
        } catch (error) {
            handleApiError(error);
        }
    },

    /**
     * Get client configuration
     * @param {string} clientKey - Client key
     * @returns {Promise<Object>} Client configuration
     */
    async getClientConfig(clientKey) {
        try {
            const response = await api.get(`/auth/clients/${clientKey}/config`);
            return response.data;
        } catch (error) {
            handleApiError(error);
        }
    },

    /**
     * Check if auth service is reachable
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        try {
            await api.get('/health');
            return true;
        } catch {
            return false;
        }
    },
};

/**
 * Get configured axios instance for custom requests
 */
export function getApiClient() {
    return api;
}

export default authApi;
