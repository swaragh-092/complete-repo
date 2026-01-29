import { auth } from '@spidy092/auth-client';

/**
 * Extract data from standardized API response
 * Response format: { success, statusCode, message, data, meta }
 */
const extractData = (res) => res.data?.data ?? res.data;

export const sessionsApi = {
    async getAll() {
        const res = await auth.api.get('/account/sessions');
        const data = extractData(res);
        // Handle both array and object with sessions property
        return Array.isArray(data) ? data : (data?.sessions || []);
    },

    async terminate(id) {
        const res = await auth.api.delete(`/account/sessions/${id}`);
        return extractData(res);
    },

    async logoutAll() {
        const res = await auth.api.post('/account/logout-all');
        return extractData(res);
    },
};