import api, { extractData, extractPaginatedData } from './api';

const BASE_URL = 'https://email.local.test/api/v1/email';

// Helper to get auth headers (if needed manually, but auth-client usually handles it)
// Note: Email service requires x-service-secret for server-to-service.
// For browser-to-service, we might need a proxy in auth-service or gateway to inject it,
// OR we use a public endpoint if one exists.
// Assuming for now we are using a proxy or the user has a way to auth.
// If direct: we need a token.

export const emailService = {
    /**
     * Get email history with pagination and filters
     */
    getHistory: async ({ page = 1, limit = 10, org_id, status, type } = {}) => {
        const params = { page, limit, org_id, status, type };
        // Clean undefined params
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        
        const res = await api.get(`${BASE_URL}/history`, { params });
        return extractPaginatedData(res);
    },

    /**
     * Get email statistics
     */
    getStats: async ({ org_id } = {}) => {
        const params = { org_id };
        const res = await api.get(`${BASE_URL}/stats`, { params });
        return extractData(res);
    },

    /**
     * Resend a failed email
     */
    resend: async (id) => {
        const res = await api.post(`${BASE_URL}/resend/${id}`);
        return extractData(res);
    },

    /**
     * Trigger cleanup (Manual)
     */
    cleanup: async () => {
        const res = await api.post(`${BASE_URL}/cleanup`);
        return extractData(res);
    }
};
