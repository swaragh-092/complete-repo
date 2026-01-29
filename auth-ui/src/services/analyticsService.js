/**
 * @fileoverview Analytics Service
 * @description Handles all Analytics related API calls
 */

import api, { extractData } from './api';

class AnalyticsService {
    /**
     * Get session statistics
     * @param {string} realm - Realm name
     * @returns {Promise<Object>} Session stats
     */
    async getSessionStats(realm) {
        try {
            const res = await api.get(`/api/admin/${realm}/analytics/session-stats`);
            return extractData(res);
        } catch (error) {
            console.error(`Failed to fetch session stats for ${realm}:`, error);
            throw error;
        }
    }

    /**
     * Get login statistics
     * @param {string} realm - Realm name
     * @param {string} [from] - Start date (ISO string)
     * @param {string} [to] - End date (ISO string)
     * @returns {Promise<Object>} Login stats
     */
    async getLoginStats(realm, from, to) {
        try {
            // Default to last 30 days if not provided
            const endDate = to ? new Date(to) : new Date();
            const startDate = from ? new Date(from) : new Date();
            if (!from) startDate.setDate(endDate.getDate() - 30);

            const params = {
                from: startDate.toISOString().split('T')[0],
                to: endDate.toISOString().split('T')[0]
            };

            const res = await api.get(`/api/admin/${realm}/analytics/login-stats`, { params });
            return extractData(res);
        } catch (error) {
            console.error(`Failed to fetch login stats for ${realm}:`, error);
            throw error;
        }
    }
}

export default new AnalyticsService();
